import { supabaseAdmin, supabasePublic } from '../config/supabase';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { redisCache } from '../config/redis';
import { UserRole, RegistrationStep } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserRole; // defaults to PATIENT for open self-registration
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Register a new user via Supabase Auth.
   * Sends email verification link with redirect callback.
   */
  async register(input: RegisterInput) {
    const { email, password, fullName, phone } = input;
    const role: UserRole = UserRole.PATIENT; // only open self-reg path

    // 0. Check if an account already exists in DB
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      const isEmail = existingUser.email?.toLowerCase() === email.toLowerCase();
      const err = new Error(
        isEmail
          ? 'An account with this email already exists.'
          : 'An account with this phone number already exists.'
      ) as Error & { statusCode?: number };
      err.statusCode = 409;
      throw err;
    }

    // 1. Create Supabase auth user via signUp to send confirmation email
    const { data: authData, error: authError } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role },
        emailRedirectTo: `${env.CORS_ORIGIN}/api/auth/callback`,
      },
    });

    if (authError || !authData.user) {
      const err = new Error(authError?.message ?? 'Failed to create auth user') as Error & { statusCode?: number };
      if (authError?.message?.toLowerCase().includes('already registered') || authError?.message?.toLowerCase().includes('already exists')) {
        err.statusCode = 409;
      }
      throw err;
    }

    const supabaseUserId = authData.user.id;

    // 2. Create our User row (transaction: roll back if either fails)
    try {
      await prisma.$transaction([
        prisma.user.create({
          data: {
            id: supabaseUserId,
            role,
            fullName,
            email,
            phone: phone ?? null,
            status: 'PENDING_VERIFICATION',
          },
        }),
        prisma.registrationProgress.create({
          data: {
            userId: supabaseUserId,
            currentStep: RegistrationStep.CREDENTIALS,
          },
        }),
      ]);
    } catch (dbError) {
      // Rollback: delete the Supabase user so they don't have orphaned auth
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch(() => {});
      throw dbError;
    }

    return {
      userId: supabaseUserId,
      email,
      role,
      requiresEmailVerification: true,
      message: 'Registration successful. Please check your email inbox to verify your account.',
    };
  },

  /**
   * Email + password login.
   * Returns raw tokens — the controller sets them as httpOnly cookies.
   */
  async login(input: LoginInput): Promise<AuthTokens & { userId: string; role: UserRole }> {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.session || !data.user) {
      throw new Error(error?.message ?? 'Invalid credentials');
    }

    // Read role from our own users table (never trust JWT)
    const user = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { role: true, status: true, fullName: true },
    });

    if (!user) {
      throw new Error('User account not found. Please register first.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('This account has been suspended. Contact support.');
    }

    // Update status to ACTIVE on first successful login after email verify
    if (user.status === 'PENDING_VERIFICATION' && data.user.email_confirmed_at) {
      await prisma.user.update({
        where: { id: data.user.id },
        data: { status: 'ACTIVE' },
      });
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in ?? 3600,
      userId: data.user.id,
      role: user.role,
    };
  },

  /**
   * Get Google OAuth URL — client redirects the browser to this URL.
   */
  async getGoogleOAuthUrl(redirectTo: string): Promise<string> {
    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error || !data.url) {
      throw new Error(error?.message ?? 'Failed to generate Google OAuth URL');
    }

    return data.url;
  },

  /**
   * Exchange a Supabase auth code (from email link or OAuth redirect) for session tokens.
   * Called by the Next.js callback route handler — runs on the server.
   */
  async exchangeCodeForSession(code: string): Promise<AuthTokens & { userId: string; role: UserRole; registrationStep: RegistrationStep }> {
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (error || !data.session || !data.user) {
      throw new Error(error?.message ?? 'Invalid or expired auth code');
    }

    const userId = data.user.id;

    // Ensure User row exists (for Google OAuth first-time sign-ins)
    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      // First Google sign-in — create rows
      user = await prisma.user.create({
        data: {
          id: userId,
          role: UserRole.PATIENT,
          fullName: data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? 'User',
          email: data.user.email,
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
          status: 'ACTIVE',
        },
      });
      await prisma.registrationProgress.create({
        data: { userId, currentStep: RegistrationStep.EMAIL_VERIFIED },
      });
    }

    // Mark email as verified
    const progress = await prisma.registrationProgress.findUnique({ where: { userId } });
    if (progress && progress.currentStep === RegistrationStep.CREDENTIALS) {
      await prisma.registrationProgress.update({
        where: { userId },
        data: { currentStep: RegistrationStep.EMAIL_VERIFIED },
      });
    }
    if (user.status === 'PENDING_VERIFICATION') {
      await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    }

    const updatedProgress = await prisma.registrationProgress.findUnique({ where: { userId } });

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in ?? 3600,
      userId,
      role: user.role,
      registrationStep: updatedProgress?.currentStep ?? RegistrationStep.EMAIL_VERIFIED,
    };
  },

  /**
   * Refresh an access token using the refresh token.
   */
  async refreshSession(refreshToken: string): Promise<AuthTokens> {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new Error(error?.message ?? 'Session refresh failed');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in ?? 3600,
    };
  },

  /**
   * Send password reset email via Supabase.
   */
  async forgotPassword(email: string, redirectTo: string) {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
    return { message: 'Password reset instructions sent to your email.' };
  },

  /**
   * Update user password — requires valid access_token from reset link.
   */
  async resetPassword(accessToken: string, newPassword: string) {
    // Verify the token first
    const { data: userData, error: verifyError } = await supabaseAdmin.auth.getUser(accessToken);
    if (verifyError || !userData.user) throw new Error('Invalid or expired reset token');

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
      password: newPassword,
    });

    if (error) throw new Error(error.message);
    return { message: 'Password updated successfully.' };
  },

  /**
   * Revoke the user's Supabase session server-side and purge Redis cache.
   */
  async logout(accessToken: string, userId?: string) {
    if (userId) {
      await Promise.all([
        redisCache.del(`user:profile:${userId}`),
        redisCache.del(`user:identity:${userId}`),
      ]).catch(() => {});
    }
    await supabaseAdmin.auth.admin.signOut(accessToken).catch(() => {});
    return { message: 'Logged out successfully.' };
  },

  /**
   * Get the authenticated user's full profile including role-specific data.
   * Cached in Redis for 15 minutes (900 seconds) for fast dashboard/navbar loads.
   */
  async getMe(userId: string) {
    const cacheKey = `user:profile:${userId}`;

    // 1. Try Redis cache
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Query Postgres on cache miss
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: { include: { medicalHistory: true } },
        doctor: true,
        healthWorker: true,
        registrationProgress: true,
      },
    });

    if (!user) throw new Error('User not found');

    // 3. Populate Redis with 15-minute TTL
    await redisCache.set(cacheKey, user, 900);

    return user;
  },
};
