/**
 * Audit Logger for StateFile
 * 
 * Tracks all authentication and security events for compliance and monitoring.
 * Stores events in PostgreSQL and optionally forwards to external logging service.
 * 
 * Events logged:
 * - login_success, login_failure
 * - logout
 * - unauthorized_access_attempt
 * - oauth_exchange_success, oauth_exchange_failure
 * - integration_connected, integration_disconnected
 * - rate_limit_exceeded
 * - session_expired
 * - suspicious_activity
 */

import { Pool } from 'pg';
import type { NextRequest } from 'next/server';

// ============================================================================
// Types
// ============================================================================

export enum AuthEventType {
  // Login events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',

  // OAuth events
  OAUTH_EXCHANGE_SUCCESS = 'oauth_exchange_success',
  OAUTH_EXCHANGE_FAILURE = 'oauth_exchange_failure',
  OAUTH_SCOPE_REQUEST = 'oauth_scope_request',

  // Access control
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
  SESSION_EXPIRED = 'session_expired',
  SESSION_INVALIDATED = 'session_invalidated',

  // Integration events
  INTEGRATION_CONNECTED = 'integration_connected',
  INTEGRATION_DISCONNECTED = 'integration_disconnected',
  INTEGRATION_VERIFIED = 'integration_verified',
  INTEGRATION_FAILED = 'integration_failed',

  // Security events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
  LOGIN_FROM_NEW_LOCATION = 'login_from_new_location',

  // Admin events (future)
  USER_CREATED = 'user_created',
  USER_DELETED = 'user_deleted',
}

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditLogEvent {
  // Basic info
  eventType: AuthEventType;
  severity?: Severity;
  userId?: string; // nullable for pre-auth events

  // Network info
  ipAddress: string;
  userAgent?: string;

  // OAuth info
  provider?: 'github' | 'gitlab'; // which OAuth provider

  // Request details
  endpoint?: string;
  method?: string; // GET, POST, etc.

  // Status
  statusCode?: number;
  success?: boolean;

  // Error details
  errorMessage?: string;
  errorCode?: string;

  // Additional metadata
  metadata?: Record<string, any>;

  // Timestamp (added by logger)
  timestamp?: Date;
}

/**
 * Geolocation info from IP lookup service
 * Used for anomaly detection (login from new country, etc.)
 */
interface GeoLocation {
  country: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================================================
// Audit Logger Class
// ============================================================================

export class AuditLogger {
  private dbPool: Pool;
  private initialized = false;

  // Cache for IP geolocation (avoid repeated lookups)
  private geoCache = new Map<string, GeoLocation | null>();

  constructor(dbPool: Pool) {
    this.dbPool = dbPool;
  }

  /**
   * Initialize audit logger: create tables if they don't exist
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.createTablesIfNotExist();
      this.initialized = true;
      console.log('✅ Audit logger initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audit logger:', error);
      throw error;
    }
  }

  /**
   * Create required database tables
   */
  private async createTablesIfNotExist() {
    const query = `
      -- Audit logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'info',
        user_id VARCHAR(255),
        ip_address INET NOT NULL,
        user_agent TEXT,
        provider VARCHAR(20), -- github, gitlab, etc.
        endpoint VARCHAR(255),
        method VARCHAR(10), -- GET, POST, etc.
        status_code INTEGER,
        success BOOLEAN,
        error_message TEXT,
        error_code VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Indexes for fast queries
        INDEX idx_event_type (event_type),
        INDEX idx_user_id (user_id),
        INDEX idx_ip_address (ip_address),
        INDEX idx_created_at (created_at),
        INDEX idx_user_event (user_id, event_type)
      );

      -- Geolocation cache (avoid repeated IP lookups)
      CREATE TABLE IF NOT EXISTS ip_geolocation_cache (
        ip_address INET PRIMARY KEY,
        country VARCHAR(2),
        city VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Suspicious activity log (for security team)
      CREATE TABLE IF NOT EXISTS suspicious_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255),
        ip_address INET NOT NULL,
        activity_type VARCHAR(50), -- brute_force, impossible_travel, etc.
        severity VARCHAR(20), -- warning, error, critical
        description TEXT,
        audit_log_ids UUID[], -- references to related audit logs
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type 
        ON audit_logs(event_type);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
        ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address 
        ON audit_logs(ip_address);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
        ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_id 
        ON suspicious_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_suspicious_activities_ip_address 
        ON suspicious_activities(ip_address);
    `;

    await this.dbPool.query(query);
  }

  /**
   * Log an authentication event
   */
  async log(event: AuditLogEvent): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const timestamp = event.timestamp || new Date();

    // Get geolocation from IP
    const geo = await this.getGeolocation(event.ipAddress);

    try {
      const query = `
        INSERT INTO audit_logs (
          event_type, severity, user_id, ip_address, user_agent,
          provider, endpoint, method, status_code, success,
          error_message, error_code, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, created_at;
      `;

      const metadata = {
        ...event.metadata,
        country: geo?.country,
        city: geo?.city,
      };

      const result = await this.dbPool.query(query, [
        event.eventType,
        event.severity || Severity.INFO,
        event.userId || null,
        event.ipAddress,
        event.userAgent || null,
        event.provider || null,
        event.endpoint || null,
        event.method || null,
        event.statusCode || null,
        event.success ?? null,
        event.errorMessage || null,
        event.errorCode || null,
        JSON.stringify(metadata),
        timestamp,
      ]);

      const logId = result.rows[0].id;

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${event.eventType}] ${event.userId || 'anonymous'} - ${event.ipAddress}`);
      }

      // Check for suspicious patterns
      await this.checkSuspiciousPatterns(event, logId);

      // Forward to external logging service (optional)
      await this.forwardToExternalService(event, logId);
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - logging failure shouldn't crash the app
      // But do alert ops team
      console.error('⚠️ Audit logging failed - check database connection');
    }
  }

  /**
   * Get geolocation for an IP address
   * Uses MaxMind GeoIP2 or similar service, with local cache
   */
  private async getGeolocation(ipAddress: string): Promise<GeoLocation | null> {
    // Check cache first
    if (this.geoCache.has(ipAddress)) {
      return this.geoCache.get(ipAddress) || null;
    }

    // Check database cache
    try {
      const query = `
        SELECT country, city, latitude, longitude FROM ip_geolocation_cache
        WHERE ip_address = $1 AND cached_at > NOW() - INTERVAL '30 days'
      `;
      const result = await this.dbPool.query(query, [ipAddress]);

      if (result.rows.length > 0) {
        const geo = result.rows[0];
        this.geoCache.set(ipAddress, geo);
        return geo;
      }
    } catch (error) {
      console.error('Failed to get geolocation from cache:', error);
    }

    // Fetch from external service (e.g., MaxMind GeoIP2)
    // This is optional - remove if you don't need geolocation
    try {
      const geo = await this.lookupIpGeolocation(ipAddress);

      // Cache it
      if (geo) {
        this.geoCache.set(ipAddress, geo);

        // Also cache in database
        try {
          const cacheQuery = `
            INSERT INTO ip_geolocation_cache (ip_address, country, city, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ip_address) DO UPDATE SET
              cached_at = NOW()
          `;
          await this.dbPool.query(cacheQuery, [
            ipAddress,
            geo.country,
            geo.city || null,
            geo.latitude || null,
            geo.longitude || null,
          ]);
        } catch (cacheError) {
          console.error('Failed to cache geolocation:', cacheError);
        }
      }

      return geo;
    } catch (error) {
      console.error('Failed to lookup geolocation:', error);
      return null;
    }
  }

  /**
   * Lookup IP geolocation from external service
   * Currently disabled - implement with MaxMind or similar service
   */
  private async lookupIpGeolocation(_ipAddress: string): Promise<GeoLocation | null> {
    // Example: Use MaxMind GeoIP2 API
    // const apiKey = process.env.MAXMIND_API_KEY;
    // const response = await fetch(`https://geoip.maxmind.com/geoip/v2.1/city/${ipAddress}`, {
    //   headers: { Authorization: `Basic ${Buffer.from(`0:${apiKey}`).toString('base64')}` }
    // });
    // const data = await response.json();
    // return { country: data.country.iso_code, city: data.city.names.en };

    // For now, return null (can be implemented later)
    return null;
  }

  /**
   * Check for suspicious patterns and create alerts
   */
  private async checkSuspiciousPatterns(event: AuditLogEvent, logId: string): Promise<void> {
    if (!event.userId) return; // Can't detect patterns for anonymous events

    try {
      // Check for brute force: multiple failed login attempts
      if (event.eventType === AuthEventType.LOGIN_FAILURE) {
        const recentFailures = await this.getRecentFailedLogins(
          event.userId,
          event.ipAddress,
          5 // last 5 minutes
        );

        if (recentFailures >= 3) {
          // 3+ failed attempts in 5 minutes = brute force
          await this.createSuspiciousActivity({
            userId: event.userId,
            ipAddress: event.ipAddress,
            activityType: 'brute_force',
            severity: Severity.WARNING,
            description: `${recentFailures} failed login attempts in 5 minutes`,
            auditLogIds: [logId],
          });
        }
      }

      // Check for impossible travel: login from two distant locations too quickly
      if (event.eventType === AuthEventType.LOGIN_SUCCESS && event.userId) {
        const possibleImpossibleTravel = await this.detectImpossibleTravel(
          event.userId,
          event.ipAddress
        );

        if (possibleImpossibleTravel) {
          await this.createSuspiciousActivity({
            userId: event.userId,
            ipAddress: event.ipAddress,
            activityType: 'impossible_travel',
            severity: Severity.ERROR,
            description: `Login from ${event.ipAddress} too soon after previous login from different location`,
            auditLogIds: [logId],
          });
        }
      }
    } catch (error) {
      console.error('Failed to check suspicious patterns:', error);
      // Don't throw - pattern detection shouldn't block logging
    }
  }

  /**
   * Get recent failed login attempts for a user
   */
  private async getRecentFailedLogins(
    userId: string,
    ipAddress: string,
    minutesWindow: number
  ): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM audit_logs
        WHERE user_id = $1
          AND event_type = $2
          AND ip_address = $3
          AND created_at > NOW() - INTERVAL '${minutesWindow} minutes'
      `;

      const result = await this.dbPool.query(query, [
        userId,
        AuthEventType.LOGIN_FAILURE,
        ipAddress,
      ]);

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Failed to get recent failed logins:', error);
      return 0;
    }
  }

  /**
   * Detect impossible travel: login from two locations too quickly
   * Returns true if suspicious
   */
  private async detectImpossibleTravel(
    userId: string,
    currentIpAddress: string
  ): Promise<boolean> {
    try {
      // Get last successful login
      const query = `
        SELECT ip_address, created_at FROM audit_logs
        WHERE user_id = $1 AND event_type = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await this.dbPool.query(query, [
        userId,
        AuthEventType.LOGIN_SUCCESS,
      ]);

      if (result.rows.length === 0) return false;

      const lastLogin = result.rows[0];
      const lastIp = lastLogin.ip_address;
      const lastTime = new Date(lastLogin.created_at);
      const currentTime = new Date();
      const minutesSinceLastLogin = (currentTime.getTime() - lastTime.getTime()) / (1000 * 60);

      // If less than 15 minutes since last login
      if (minutesSinceLastLogin < 15 && lastIp !== currentIpAddress) {
        // IPs are different and time is very short = suspicious
        // (In reality, you'd calculate distance using geolocation)
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to detect impossible travel:', error);
      return false;
    }
  }

  /**
   * Create a suspicious activity record
   */
  private async createSuspiciousActivity(data: {
    userId: string;
    ipAddress: string;
    activityType: string;
    severity: Severity;
    description: string;
    auditLogIds: string[];
  }): Promise<void> {
    try {
      const query = `
        INSERT INTO suspicious_activities (
          user_id, ip_address, activity_type, severity, description, audit_log_ids
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await this.dbPool.query(query, [
        data.userId,
        data.ipAddress,
        data.activityType,
        data.severity,
        data.description,
        JSON.stringify(data.auditLogIds),
      ]);

      // Alert ops team (implement notification here)
      console.warn(`🚨 Suspicious activity detected: ${data.activityType} for user ${data.userId}`);
    } catch (error) {
      console.error('Failed to create suspicious activity record:', error);
    }
  }

  /**
   * Forward audit log to external service (Datadog, Splunk, etc.)
   * Implement based on your monitoring setup
   */
  private async forwardToExternalService(event: AuditLogEvent, logId: string): Promise<void> {
    // Example: Forward to Datadog
    if (process.env.DATADOG_API_KEY && process.env.NODE_ENV === 'production') {
      try {
        await fetch('https://http-intake.logs.datadoghq.com/v1/input', {
          method: 'POST',
          headers: {
            'DD-API-KEY': process.env.DATADOG_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service: 'statefile-auth',
            hostname: process.env.HOSTNAME || 'unknown',
            ddsource: 'nodejs',
            ddtags: `env:${process.env.NODE_ENV},event_type:${event.eventType}`,
            message: `Auth event: ${event.eventType}`,
            event_type: event.eventType,
            user_id: event.userId,
            ip_address: event.ipAddress,
            log_id: logId,
          }),
        });
      } catch (error) {
        console.error('Failed to forward to Datadog:', error);
        // Don't throw - external service failure shouldn't block app
      }
    }
  }

  /**
   * Utility: Get audit logs for a user
   * Useful for user dashboard: "Here's what we logged for your account"
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const query = `
        SELECT id, event_type, severity, ip_address, endpoint, status_code, 
               success, error_message, metadata, created_at
        FROM audit_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.dbPool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Failed to get user audit logs:', error);
      return [];
    }
  }

  /**
   * Utility: Get suspicious activities
   * For security team dashboard
   */
  async getSuspiciousActivities(limit: number = 100) {
    try {
      const query = `
        SELECT id, user_id, ip_address, activity_type, severity, 
               description, resolved, created_at
        FROM suspicious_activities
        WHERE resolved = FALSE
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await this.dbPool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Failed to get suspicious activities:', error);
      return [];
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract client IP from Next.js request
 * Works with proxies (Cloudflare, Nginx, etc.)
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
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Extract endpoint/pathname from request
 */
export function getEndpoint(request: NextRequest): string {
  return request.nextUrl.pathname;
}

// ============================================================================
// Singleton Instance (Optional)
// ============================================================================

let auditLoggerInstance: AuditLogger | null = null;

export async function getAuditLogger(dbPool: Pool): Promise<AuditLogger> {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger(dbPool);
    await auditLoggerInstance.initialize();
  }
  return auditLoggerInstance;
}
