import { Request, Response, NextFunction } from 'express';
import { CustomError, formatErrorResponse, isOperationalError } from '../utils/errors';
import logger from '../utils/logger';

// Not found handler
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  const response = formatErrorResponse(error, req);
  res.status(404).json(response);
};

// Global error handler
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString()
  });

  // Format error response
  const response = formatErrorResponse(error, req);

  // Set status code
  const statusCode = error instanceof CustomError ? error.statusCode : 500;
  res.status(statusCode);

  // Send response
  res.json(response);

  // Handle operational vs programming errors
  if (!isOperationalError(error)) {
    logger.error('Non-operational error detected, shutting down gracefully');
    process.exit(1);
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Response helpers
export const successResponse = <T>(res: Response, data: T, message?: string, statusCode: number = 200) => {
  const response = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    path: res.req.path,
    method: res.req.method,
  };
  
  return res.status(statusCode).json(response);
};

export const errorResponse = (res: Response, error: string | Error, statusCode: number = 500) => {
  const message = error instanceof Error ? error.message : error;
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: res.req.path,
    method: res.req.method,
  };
  
  return res.status(statusCode).json(response);
}; 