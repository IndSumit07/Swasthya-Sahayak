import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { prisma } from '../config/prisma';
import { checkSupabaseConnection } from '../config/supabase';
import { checkRedisConnection } from '../config/redis';
import { getQueuesHealth } from '../queues';
import { env } from '../config/env';
import { ApiResponse } from '../types';

export const getHealthStatus = async (_req: Request, res: Response): Promise<void> => {
  // Check Supabase
  const supabaseOk = await checkSupabaseConnection();

  // Check MongoDB
  const mongoStatusMap: Record<number, string> = {
    0: 'DISCONNECTED',
    1: 'CONNECTED',
    2: 'CONNECTING',
    3: 'DISCONNECTING',
  };
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoStatusMap[mongoState] || 'UNKNOWN';

  // Check Prisma / PostgreSQL
  let postgresStatus = 'DISCONNECTED';
  try {
    if (env.DATABASE_URL && !env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
      await prisma.$queryRaw`SELECT 1`;
      postgresStatus = 'CONNECTED';
    } else {
      postgresStatus = 'PENDING_CREDENTIALS';
    }
  } catch {
    postgresStatus = 'ERROR';
  }

  // Check Redis & BullMQ Queues
  const redisHealth = await checkRedisConnection();
  const queueHealth = await getQueuesHealth();

  const healthData = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.1.0',
    deployment: 'github-actions-verified',
    status: 'UP',
    services: {
      supabase: {
        status: supabaseOk ? 'CONNECTED' : 'DISCONNECTED',
        url: env.SUPABASE_URL,
      },
      postgresPrisma: {
        status: postgresStatus,
      },
      mongodb: {
        status: mongoStatus,
        uri: env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Mask credentials
      },
      redis: {
        status: redisHealth.status,
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        latencyMs: redisHealth.latencyMs,
      },
      queues: queueHealth,
    },
  };

  const response: ApiResponse<typeof healthData> = {
    success: true,
    message: 'Server and services health status.',
    data: healthData,
  };

  res.status(200).json(response);
};
