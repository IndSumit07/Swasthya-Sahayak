import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

// 404 Not Found Middleware
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Not Found - Route ${req.originalUrl} does not exist on this server.`,
  };
  res.status(404).json(response);
};

// Global Error Handler Middleware
export const errorHandler = (
  err: Error & { status?: number; statusCode?: number; code?: string; meta?: { target?: string[] } },
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = err.meta?.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target) : 'field';
    message = `A record with this ${target} already exists.`;
  }

  logger.error(`${statusCode} - ${message} - Stack: ${err.stack}`);

  const response: ApiResponse = {
    success: false,
    error: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
