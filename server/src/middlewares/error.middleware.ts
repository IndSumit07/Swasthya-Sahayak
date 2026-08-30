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
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`${statusCode} - ${message} - Stack: ${err.stack}`);

  const response: ApiResponse = {
    success: false,
    error: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
