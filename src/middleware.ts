import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from './lib/auth';

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
    pathname === '/activate' ||        // First-time owner password setup
    pathname === '/signup' ||
    pathname.startsWith('/onboard') ||
    pathname.startsWith('/api/onboard') ||
    (pathname.startsWith('/api/access-requests') && request.method === 'POST');

  if (isPublic) {
    return NextResponse.next();
  }

  // 2. No session → redirect to PIN selector
  if (!token) {
    if (pathname === '/super-admin') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/app', request.url));
  }

  const session = await decryptSession(token);
  if (!session) {
    const response = NextResponse.redirect(new URL('/app', request.url));
    response.cookies.delete('session');
    return response;
  }

  // 3. /flowriq-console — founder-only, requires super_admin
  if (pathname.startsWith('/flowriq-console')) {
    if (session.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // 4. /api/access-requests GET — restrict to super_admin
  if (pathname.startsWith('/api/access-requests') && request.method === 'GET') {
    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // 5. /api/access-requests/[id] PATCH — restrict to super_admin
  if (pathname.match(/^\/api\/access-requests\/[^/]+$/) && request.method === 'PATCH') {
    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // 6. Routing protection and role-based redirection
  if (pathname === '/super-admin') {
    if (session.role !== 'super_admin') {
      return NextResponse.redirect(new URL(session.role === 'admin' ? '/admin' : '/orders/new', request.url));
    }
  }

  if (pathname === '/admin') {
    if (session.role === 'super_admin') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/orders/new', request.url));
    }
  }

  if (pathname === '/orders/new') {
    if (session.role === 'super_admin') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // 7. API Multi-Tenant isolation header propagation
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.id);
  requestHeaders.set('x-user-role', session.role);
  requestHeaders.set('x-company-id', session.companyId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-flowriq\.png|logo\.png|icon.*\.png|manifest\.json|sw\.js).*)'],
};
