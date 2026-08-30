import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { prisma } from '../config/prisma';
import { redisCache } from '../config/redis';
import { UserRole, UserStatus } from '@prisma/client';

// Extend Express Request with identity
declare global {
  namespace Express {
    interface Request {
      identity?: {
        userId: string;
        role: UserRole;
        status: UserStatus;
      };
    }
  }
}

const IDENTITY_CACHE_TTL = 900; // 15 minutes TTL

/**
 * authenticate — reads the httpOnly access token cookie, verifies it with Supabase,
 * attaches { supabaseUser } to the request. Does NOT check our DB yet.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.ss_access_token as string | undefined;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ success: false, error: 'Invalid or expired session' });
    return;
  }

  // Attach the Supabase user id to the request so resolveIdentity can use it
  (req as Request & { supabaseUserId?: string }).supabaseUserId = data.user.id;
  next();
}

/**
 * resolveIdentity — reads role and status from Redis cache or users table.
 * Must run after `authenticate`.
 */
export async function resolveIdentity(req: Request, res: Response, next: NextFunction): Promise<void> {
  const supabaseUserId = (req as Request & { supabaseUserId?: string }).supabaseUserId;

  if (!supabaseUserId) {
    res.status(401).json({ success: false, error: 'Identity not resolved' });
    return;
  }

  const cacheKey = `user:identity:${supabaseUserId}`;

  // 1. Try Redis cache
  let user = await redisCache.get<{ id: string; role: UserRole; status: UserStatus }>(cacheKey);

  // 2. Fetch from DB on cache miss
  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: supabaseUserId },
      select: { id: true, role: true, status: true },
    });

    if (user) {
      // Store in Redis with TTL
      await redisCache.set(cacheKey, user, IDENTITY_CACHE_TTL);
    }
  }

  if (!user) {
    res.status(401).json({ success: false, error: 'User account not found' });
    return;
  }

  if (user.status === 'SUSPENDED') {
    res.status(403).json({ success: false, error: 'Account suspended' });
    return;
  }

  req.identity = { userId: user.id, role: user.role, status: user.status };
  next();
}

/**
 * authorize(...roles) — role-based access control gate.
 * Usage: router.get('/admin', authenticate, resolveIdentity, authorize('DISTRICT_ADMIN'))
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.identity || !roles.includes(req.identity.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
