import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
];

const AUTH_ROUTES = ['/login'];

function isValidCallbackUrl(url: string): boolean {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const parsed = new URL(url, appUrl);
    return parsed.origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookieName = process.env.NODE_ENV === 'production'
    ? '__Secure-better-auth.session_token'
    : 'better-auth.session_token';

  const sessionToken = request.cookies.get(cookieName)?.value;

  const isAuthenticated = !!sessionToken;

  // redirect unauthenticated users trying to access protected routes to /login
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Only set callback URL if it's safe (same-origin)
    if (isValidCallbackUrl(pathname)) {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  // redirect authenticated users away from /login to /dashboard
  if (isAuthRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next static files and images
     * - favicon.ico, sitemap, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
