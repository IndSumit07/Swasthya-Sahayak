import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Next.js Route Handler — receives the Supabase auth code from:
 *  a) Email verification link click
 *  b) Google OAuth redirect
 *
 * Proxies the code to the Express server which exchanges it for tokens
 * and sets the httpOnly cookie. The browser client never sees a raw token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  try {
    const expressRes = await fetch(`${API_BASE}/auth/callback?code=${encodeURIComponent(code)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!expressRes.ok) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    const json = (await expressRes.json()) as {
      success: boolean;
      data?: { registrationStep?: string; role?: string };
    };

    // Extract Set-Cookie from Express response and forward it to the browser
    const setCookieHeader = expressRes.headers.get('set-cookie');
    const step = json.data?.registrationStep;

    // Decide where to redirect based on registration completion
    let redirectPath = '/dashboard';
    if (step === 'EMAIL_VERIFIED' || step === 'CREDENTIALS') {
      redirectPath = '/register/complete';
    }

    const redirectResponse = NextResponse.redirect(new URL(redirectPath, request.url));

    // Forward the httpOnly cookies set by Express to the browser
    if (setCookieHeader) {
      redirectResponse.headers.set('set-cookie', setCookieHeader);
    }

    return redirectResponse;
  } catch {
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
