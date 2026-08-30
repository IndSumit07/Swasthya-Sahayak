import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Standard Redis connection config for BullMQ and ioredis
 */
export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const redisConnectionOptions: RedisOptions = {
  ...redisConfig,
  lazyConnect: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
};

/**
 * Primary Redis Client Singleton for application caching, locks, and general operations.
 */
export const redisClient: Redis = new Redis(redisConnectionOptions);

// Event Listeners for logging and monitoring
redisClient.on('connect', () => {
  logger.info(`Redis: Connected to ${env.REDIS_HOST}:${env.REDIS_PORT}`);
});

redisClient.on('ready', () => {
  logger.info('Redis: Connection is ready to accept commands');
});

redisClient.on('error', (err: Error) => {
  logger.error('Redis Connection Error:', err.message);
});

redisClient.on('close', () => {
  logger.warn('Redis: Connection closed');
});

redisClient.on('reconnecting', (time: number) => {
  logger.info(`Redis: Reconnecting in ${time}ms...`);
});

/**
 * Explicitly connect to Redis on server startup.
 */
export const connectRedis = async (): Promise<boolean> => {
  try {
    if (redisClient.status === 'ready' || redisClient.status === 'connecting' || redisClient.status === 'connect') {
      return true;
    }
    await redisClient.connect();
    const ping = await redisClient.ping();
    logger.info(`Redis: Ping response -> ${ping}`);
    return true;
  } catch (error) {
    logger.error('Redis: Failed to connect on startup:', error);
    return false;
  }
};

/**
 * Disconnect from Redis on graceful server shutdown.
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient.status === 'ready' || redisClient.status === 'connect') {
      await redisClient.quit();
      logger.info('Redis: Gracefully disconnected');
    }
  } catch (error) {
    logger.error('Redis: Error disconnecting:', error);
  }
};

/**
 * Helper to check live connection status (for health checks).
 */
export const checkRedisConnection = async (): Promise<{ status: string; latencyMs?: number }> => {
  try {
    const start = Date.now();
    const pong = await redisClient.ping();
    const latencyMs = Date.now() - start;
    if (pong === 'PONG') {
      return { status: 'CONNECTED', latencyMs };
    }
    return { status: 'DEGRADED' };
  } catch {
    return { status: 'DISCONNECTED' };
  }
};

/**
 * Generic High-Performance Cache Utility
 * Use this anywhere in the codebase for caching API results, sessions, or rate limiting.
 */
export const redisCache = {
  /**
   * Get parsed JSON from Redis cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.error(`Redis Cache GET error for key [${key}]:`, err);
      return null;
    }
  },

  /**
   * Set JSON value with optional TTL in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const stringified = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await redisClient.setex(key, ttlSeconds, stringified);
      } else {
        await redisClient.set(key, stringified);
      }
      return true;
    } catch (err) {
      logger.error(`Redis Cache SET error for key [${key}]:`, err);
      return false;
    }
  },

  /**
   * Delete a specific cache key
   */
  async del(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      logger.error(`Redis Cache DEL error for key [${key}]:`, err);
      return false;
    }
  },

  /**
   * Delete keys matching a pattern (e.g. "facilities:*")
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const stream = redisClient.scanStream({ match: pattern });
      let count = 0;
      for await (const resultKeys of stream) {
        if (resultKeys.length) {
          await redisClient.del(...resultKeys);
          count += resultKeys.length;
        }
      }
      return count;
    } catch (err) {
      logger.error(`Redis Cache DEL_PATTERN error for [${pattern}]:`, err);
      return 0;
    }
  },

  /**
   * Acquire a distributed lock (for appointment booking / concurrent transactions)
   */
  async acquireLock(lockKey: string, ttlMs: number = 5000): Promise<boolean> {
    try {
      const result = await redisClient.set(`lock:${lockKey}`, 'LOCKED', 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (err) {
      logger.error(`Redis AcquireLock error for [${lockKey}]:`, err);
      return false;
    }
  },

  /**
   * Release a distributed lock
   */
  async releaseLock(lockKey: string): Promise<void> {
    try {
      await redisClient.del(`lock:${lockKey}`);
    } catch (err) {
      logger.error(`Redis ReleaseLock error for [${lockKey}]:`, err);
    }
  },
};
