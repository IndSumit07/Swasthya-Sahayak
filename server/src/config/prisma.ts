import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const connectPrisma = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    logger.info('Connected to Supabase PostgreSQL via Prisma ORM');
    return true;
  } catch (error: unknown) {
    logger.warn('Prisma PostgreSQL connection notice (ensure DATABASE_URL has valid credentials):', (error as Error).message);
    return false;
  }
};

export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from Prisma PostgreSQL');
  } catch (error: unknown) {
    logger.error('Error disconnecting Prisma PostgreSQL:', error);
  }
};
