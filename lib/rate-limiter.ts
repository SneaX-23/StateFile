/**
 * Rate Limiter for StateFile
 * 
 * Prevents abuse and brute force attacks using Redis-based distributed rate limiting.
 * Supports both IP-based and user-based rate limiting.
 * 
 * Features:
 * - Sliding window rate limiting
 * - IP-based and user-based limits
 * - Different limits per endpoint
 * - Graceful degradation if Redis unavailable
 * - Detailed rate limit headers in responses
 * 
 * Usage:
 *   const result = await rateLimit(request, {
 *     windowMs: 60000, // 1 minute
 *     maxRequests: 10,
 *     keyPrefix: 'auth:login',
 *     byUser: false, // or true to rate limit by user_id
 *   });
 */

import type { NextRequest } from 'next/server';
import { createClient, type RedisClientType } from 'redis';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests allowed in window
  keyPrefix: string; // Prefix for Redis key (e.g., 'auth:login')
  byUser?: boolean; // Rate limit by user_id instead of IP
  skipOnError?: boolean; // If Redis fails, allow request (default: true)
  message?: string; // Custom error message
}

export interface RateLimitResult {
  success: boolean; // Whether request is allowed
  remaining: number; // Remaining requests in current window
  limit: number; // Total limit
  resetTime: number; // Timestamp when limit resets (ms)
  retryAfter?: number; // Seconds to retry after (if rate limited)
  key: string; // Redis key used for this limit
}

// ============================================================================
// Rate Limiter Class
// ============================================================================

export class RateLimiter {
  private redisClient: RedisClientType | null = null;
  private connected = false;
  private initialized = false;

  constructor() {
    // Initialization deferred to async method
  }

  /**
   * Initialize Redis connection
   * Call this once at app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis client error:', err);
        this.connected = false;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected for rate limiting');
        this.connected = true;
      });

      await this.redisClient.connect();
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize rate limiter:', error);
      console.warn(
        '⚠️ Rate limiting disabled. Redis not available. ' +
        'In production, ensure Redis is running.'
      );
      this.connected = false;
      this.initialized = true; // Mark as initialized anyway (graceful degradation)
    }
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(
    identifier: string, // IP address or user ID
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    const key = `ratelimit:${options.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // If Redis not connected, allow request (graceful degradation)
    if (!this.connected || !this.redisClient) {
      console.warn(`⚠️ Rate limiter unavailable for key: ${key}`);
      return {
        success: true,
        remaining: options.maxRequests,
        limit: options.maxRequests,
        resetTime: now + options.windowMs,
        key,
      };
    }

    try {
      // Use Redis Lua script for atomic operation
      // This prevents race conditions in distributed systems
      const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window_start = tonumber(ARGV[2])
        local max_requests = tonumber(ARGV[3])
        local window_ms = tonumber(ARGV[4])

        -- Remove old entries outside the window
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

        -- Count current requests in window
        local current = redis.call('ZCARD', key)

        -- Check if limit exceeded
        if current >= max_requests then
          -- Return current count and reset time
          return {0, current, max_requests, now + window_ms}
        end

        -- Add current request to sorted set (score = timestamp)
        redis.call('ZADD', key, now, now)

        -- Set expiration (clean up old keys)
        redis.call('EXPIRE', key, math.ceil(window_ms / 1000))

        -- Return remaining requests and reset time
        return {1, max_requests - current - 1, max_requests, now + window_ms}
      `;

      const result = await this.redisClient.eval(script, {
        keys: [key],
        arguments: [now.toString(), windowStart.toString(), options.maxRequests.toString(), options.windowMs.toString()],
      }) as number[];

      const [allowed, remaining, limit, resetTime] = result;

      return {
        success: allowed === 1,
        remaining: Math.max(0, remaining),
        limit,
        resetTime,
        key,
        retryAfter: allowed === 0 ? Math.ceil((resetTime - now) / 1000) : undefined,
      };
    } catch (error) {
      console.error('Rate limiter error:', error);

      // Graceful degradation: if Redis fails, allow request
      if (options.skipOnError !== false) {
        console.warn(`⚠️ Rate limiting failed for ${key}, allowing request`);
        return {
          success: true,
          remaining: options.maxRequests,
          limit: options.maxRequests,
          resetTime: now + options.windowMs,
          key,
        };
      }

      // If skipOnError is false, fail closed (reject request)
      return {
        success: false,
        remaining: 0,
        limit: options.maxRequests,
        resetTime: now + options.windowMs,
        key,
        retryAfter: options.windowMs / 1000,
      };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redisClient && this.connected) {
      await this.redisClient.quit();
      this.connected = false;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

// ============================================================================
// Next.js Integration Helpers
// ============================================================================

/**
 * Extract rate limit identifier from request
 * Returns either IP address or user_id (if available in session)
 */
export function getRateLimitIdentifier(
  request: NextRequest,
  byUser: boolean = false
): string {
  if (byUser) {
    // Try to get user ID from session cookie or header
    const sessionToken =
      request.cookies.get('better-auth.session_token')?.value ||
      request.cookies.get('__Secure-better-auth.session_token')?.value;

    // In a real app, you'd decode the session token to get user_id
    // For now, we'll just use IP as fallback
    if (sessionToken) {
      // This is a placeholder - implement actual session decoding
      return `user:${sessionToken}`;
    }
  }

  // Default to IP-based rate limiting
  return getClientIp(request);
}

/**
 * Extract client IP from request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  );
}

/**
 * Apply rate limit to a Next.js request
 * 
 * Usage in route:
 *   const result = await applyRateLimit(request, {
 *     windowMs: 60000,
 *     maxRequests: 10,
 *     keyPrefix: 'auth:login',
 *   });
 *   
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       {
 *         status: 429,
 *         headers: getRateLimitHeaders(result),
 *       }
 *     );
 *   }
 */
export async function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const rateLimiter = getRateLimiter();
  const identifier = getRateLimitIdentifier(request, options.byUser);

  const result = await rateLimiter.checkLimit(identifier, options);

  return result;
}

/**
 * Generate rate limit response headers
 * Standard headers used by most APIs (X-RateLimit-*)
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  };
}

// ============================================================================
// Pre-configured Rate Limit Configs
// ============================================================================

/**
 * Suggested rate limit configurations for different endpoints
 * Adjust based on your requirements
 */
export const RATE_LIMIT_CONFIGS = {
  // Auth endpoints - strict limits (prevent brute force)
  auth: {
    loginAttempt: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes = brute force protection
      keyPrefix: 'auth:login',
    } as RateLimitOptions,

    oauthCallback: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 exchanges per minute
      keyPrefix: 'auth:oauth-callback',
    } as RateLimitOptions,

    signup: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 signups per hour per IP (prevent spam)
      keyPrefix: 'auth:signup',
    } as RateLimitOptions,

    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 reset requests per hour
      keyPrefix: 'auth:password-reset',
    } as RateLimitOptions,
  },

  // API endpoints - moderate limits
  api: {
    github: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // GitHub API calls are expensive
      keyPrefix: 'api:github',
    } as RateLimitOptions,

    integrationConnect: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // Connect integration attempts
      keyPrefix: 'api:integration-connect',
    } as RateLimitOptions,

    scan: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // Security scans are CPU-intensive
      keyPrefix: 'api:scan',
    } as RateLimitOptions,
  },

  // General API endpoints - permissive limits
  general: {
    default: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      keyPrefix: 'api:general',
    } as RateLimitOptions,
  },
};

// ============================================================================
// Exports for Testing & Debugging
// ============================================================================

/**
 * Reset rate limit for a key (useful for testing)
 * ONLY use this in development/testing
 */
export async function resetRateLimit(key: string): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('resetRateLimit only available in development');
  }

  const rateLimiter = getRateLimiter();
  // Access private redisClient via type assertion (bad practice, but useful for testing)
  const client = (rateLimiter as any).redisClient;
  if (client) {
    await client.del(`ratelimit:${key}`);
  }
}

/**
 * Get current rate limit status for debugging
 */
export async function getRateLimitStatus(key: string): Promise<any> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('getRateLimitStatus only available in development');
  }

  const rateLimiter = getRateLimiter();
  const client = (rateLimiter as any).redisClient;

  if (!client) return null;

  const fullKey = `ratelimit:${key}`;
  const count = await client.zcard(fullKey);
  const ttl = await client.ttl(fullKey);

  return { key: fullKey, count, ttl };
}
