import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { connectPrisma, disconnectPrisma } from './config/prisma';
import { checkSupabaseConnection } from './config/supabase';
import { connectRedis, disconnectRedis } from './config/redis';
import { startWorkers, stopWorkers } from './queues/workers';

const startServer = async () => {
  // Initialize Database & Service Connections
  logger.info('Initializing service connections...');
  await checkSupabaseConnection();
  
  if (env.DATABASE_URL && !env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    await connectPrisma();
  } else {
    logger.info('Supabase PostgreSQL (Prisma): Please provide database password in .env (DATABASE_URL)');
  }

  await connectMongoDB();

  // Initialize Redis Connection & BullMQ Queue Workers
  const redisConnected = await connectRedis();
  if (redisConnected) {
    startWorkers();
  } else {
    logger.warn('Redis: Running without active Redis connection. Queue workers paused.');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use.`);
      process.exit(1);
    } else {
      logger.error('Server listener error:', err);
    }
  });

  // nodemon restart signal handling to release port immediately
  process.once('SIGUSR2', () => {
    server.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });

  // Graceful Shutdown
  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    server.close(async () => {
      logger.info('HTTP server closed.');
      await stopWorkers();
      await disconnectRedis();
      await disconnectPrisma();
      await disconnectMongoDB();
      logger.info('All connections closed. Process terminating.');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Global Unhandled Error Catchers
process.on('uncaughtException', (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});
