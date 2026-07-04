import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from './lib/auth';
import { hasPermission } from './lib/rbac';
import { Permissions } from './lib/rbac/permissions';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // 1. Static assets & public pages whitelist (no auth required)
  const isPublic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/api/session' ||
    pathname === '/favicon.ico' ||
    pathname === '/' ||
    pathname.startsWith('/request-access') ||
    pathname === '/app' ||
    pathname === '/activate' ||
    pathname === '/signup' ||
    pathname.startsWith('/onboard') ||
    pathname.startsWith('/api/onboard') ||
    pathname === '/field-fast' ||      // Worker portal uses internal PIN auth
    pathname.startsWith('/field-fast/') ||\n    pathname === '/owner' ||           // Owner portal uses internal PIN auth
    pathname.startsWith('/owner/') ||
    pathname === '/api/test-notif' ||  // Email diagnostic endpoint (no sensitive data)
    (pathname.startsWith('/api/access-requests') && request.method === 'POST');

  if (isPublic) {
    return NextResponse.next();
  }

  // 2. No session → redirect to login
  if (!token) {
    if (pathname === '/super-admin') {
      return NextResponse.next(); // super-admin has its own PIN lock
    }
    return NextResponse.redirect(new URL('/app', request.url));
  }

  const session = await decryptSession(token);
  if (!session) {
    const response = NextResponse.redirect(new URL('/app', request.url));
    response.cookies.delete('session');
    return response;
  }

  // 3. Permission-based route protection (no hardcoded role strings)

  // /flowriq-console — platform admin only
  if (pathname.startsWith('/flowriq-console')) {
    if (!hasPermission(session, Permissions.PLATFORM_ADMIN)) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // /super-admin — platform admin only
  if (pathname === '/super-admin') {
    if (!hasPermission(session, Permissions.PLATFORM_ADMIN)) {
      return NextResponse.redirect(new URL('/owner', request.url));
    }
  }

  // /admin/* — legacy redirect
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL('/owner', request.url));
  }

  // /api/access-requests GET/PATCH — platform admin only
  if (pathname.startsWith('/api/access-requests') && request.method === 'GET') {
    if (!hasPermission(session, Permissions.PLATFORM_ADMIN)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Platform admin access required' } },
        { status: 403 }
      );
    }
  }

  if (pathname.match(/^\/api\/access-requests\/[^/]+$/) && request.method === 'PATCH') {
    if (!hasPermission(session, Permissions.PLATFORM_ADMIN)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Platform admin access required' } },
        { status: 403 }
      );
    }
  }

  // 4. Inject context headers for API routes + request tracing
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id',    session.id);
  requestHeaders.set('x-user-role',  session.role);
  requestHeaders.set('x-company-id', session.companyId);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // Expose request ID in response for client-side correlation
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-flowriq\\.png|logo\\.png|icon.*\\.png|manifest\\.json|sw\\.js).*)'],
};
