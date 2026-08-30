import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectMongoDB = async (): Promise<boolean> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error: unknown) {
    logger.warn('MongoDB connection notice (ensure MongoDB is running or MONGODB_URI is valid):', (error as Error).message);
    return false;
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error: unknown) {
    logger.error('Error disconnecting MongoDB:', error);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB connection re-established');
});
