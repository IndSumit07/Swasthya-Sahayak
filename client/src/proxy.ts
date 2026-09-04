import { NextResponse, type NextRequest } from 'next/server';

function getApiBase(request: NextRequest): string {
  const envUrl = (process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }
  const host = request.headers.get('host') || '';
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}/api/v1`;
  }
  return envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:4000/api/v1';
}

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard'];

// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute  = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  const apiBase = getApiBase(request);

  // Forward the cookies from the browser request to the Express /auth/me check
  const cookieHeader = request.headers.get('cookie') ?? '';

  let isAuthenticated = false;
  let userRole: string | null = null;

  try {
    const meRes = await fetch(`${apiBase}/auth/me`, {
      headers: { cookie: cookieHeader },
      signal: AbortSignal.timeout(3000),
    });

    if (meRes.ok) {
      const json = (await meRes.json()) as { success: boolean; data?: { role: string } };
      isAuthenticated = json.success;
      userRole = json.data?.role ?? null;
    }
  } catch {
    isAuthenticated = false;
  }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();
  if (userRole) {
    response.headers.set('x-user-role', userRole);
  }
  return response;
}

export default proxy;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/register/:path*',
  ],
};
