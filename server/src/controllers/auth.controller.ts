import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { env } from '../config/env';

// Cookie config — httpOnly prevents JS access; Secure in prod
const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_MAX_AGE  = 60 * 60;           // 1 hour (seconds)
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setAuthCookies(res: Response, access_token: string, refresh_token: string) {
  res.cookie('ss_access_token', access_token, { ...COOKIE_OPTS, maxAge: ACCESS_MAX_AGE * 1000 });
  res.cookie('ss_refresh_token', refresh_token, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE * 1000 });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('ss_access_token', { path: '/' });
  res.clearCookie('ss_refresh_token', { path: '/' });
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, fullName, phone } = req.body as {
        email: string; password: string; fullName: string; phone?: string;
      };

      if (!email || !password || !fullName) {
        res.status(400).json({ success: false, error: 'email, password and fullName are required' });
        return;
      }

      const result = await authService.register({ email, password, fullName, phone });

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as { email: string; password: string };

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'email and password are required' });
        return;
      }

      const { access_token, refresh_token, userId, role } = await authService.login({ email, password });
      setAuthCookies(res, access_token, refresh_token);

      res.json({ success: true, data: { userId, role } });
    } catch (err) {
      next(err);
    }
  },

  async googleOAuth(_req: Request, res: Response, next: NextFunction) {
    try {
      const origin = env.CORS_ORIGIN;
      const callbackUrl = `${origin}/api/auth/callback`;
      const url = await authService.getGoogleOAuthUrl(callbackUrl);
      res.json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  },

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        res.status(400).json({ success: false, error: 'Missing auth code' });
        return;
      }

      const { access_token, refresh_token, userId, role, registrationStep } =
        await authService.exchangeCodeForSession(code);

      setAuthCookies(res, access_token, refresh_token);

      res.json({ success: true, data: { userId, role, registrationStep } });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.ss_refresh_token as string | undefined;
      if (!refreshToken) {
        res.status(401).json({ success: false, error: 'No refresh token' });
        return;
      }

      const { access_token, refresh_token } = await authService.refreshSession(refreshToken);
      setAuthCookies(res, access_token, refresh_token);

      res.json({ success: true, message: 'Session refreshed' });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.cookies?.ss_access_token as string | undefined;
      if (accessToken) {
        await authService.logout(accessToken).catch(() => {}); // best-effort revoke
      }
      clearAuthCookies(res);
      res.json({ success: true, message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as { email: string };
      if (!email) {
        res.status(400).json({ success: false, error: 'email is required' });
        return;
      }

      const redirectTo = `${env.CORS_ORIGIN}/reset-password`;
      const result = await authService.forgotPassword(email, redirectTo);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { newPassword } = req.body as { newPassword: string };
      const accessToken = req.cookies?.ss_access_token as string | undefined;

      if (!accessToken) {
        res.status(401).json({ success: false, error: 'No active session for password reset' });
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'newPassword must be at least 6 characters' });
        return;
      }

      const result = await authService.resetPassword(accessToken, newPassword);
      clearAuthCookies(res); // force re-login after reset
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      // `req.identity` is set by auth.middleware
      const userId = (req as Request & { identity?: { userId: string } }).identity?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const user = await authService.getMe(userId);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};
