import { AppError } from '../types/global';

// Custom error class
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (code) {
      this.code = code;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends CustomError {
  constructor(message: string, code?: string) {
    super(message, 400, code || 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed', code?: string) {
    super(message, 401, code || 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied', code?: string) {
    super(message, 403, code || 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, 404, code || 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict', code?: string) {
    super(message, 409, code || 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded', code?: string) {
    super(message, 429, code || 'RATE_LIMIT_ERROR');
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(message, 500, code || 'INTERNAL_SERVER_ERROR');
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string = 'Service unavailable', code?: string) {
    super(message, 503, code || 'SERVICE_UNAVAILABLE_ERROR');
  }
}

// Error codes enum
export enum ErrorCodes {
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED = 'ROLE_REQUIRED',
  
  // Resource errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  SECURITY_EVENT_NOT_FOUND = 'SECURITY_EVENT_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  
  // Security errors
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  DATA_BREACH = 'DATA_BREACH',
  
  // Service errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  REDIS_CONNECTION_FAILED = 'REDIS_CONNECTION_FAILED',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

// Error factory functions
export const createValidationError = (field: string, message: string) => {
  return new ValidationError(`${field}: ${message}`, ErrorCodes.INVALID_INPUT);
};

export const createAuthenticationError = (message?: string) => {
  return new AuthenticationError(message, ErrorCodes.INVALID_CREDENTIALS);
};

export const createAuthorizationError = (message?: string) => {
  return new AuthorizationError(message, ErrorCodes.INSUFFICIENT_PERMISSIONS);
};

export const createNotFoundError = (resource: string) => {
  return new NotFoundError(`${resource} not found`);
};

export const createConflictError = (resource: string) => {
  return new ConflictError(`${resource} already exists`, ErrorCodes.RESOURCE_ALREADY_EXISTS);
};

export const createRateLimitError = (retryAfter?: number) => {
  const message = retryAfter 
    ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
    : 'Rate limit exceeded';
  return new RateLimitError(message, ErrorCodes.RATE_LIMIT_EXCEEDED);
};

// Error handling utilities
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof CustomError) {
    return error.isOperational;
  }
  return false;
};

export const handleAsyncError = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response formatter
export const formatErrorResponse = (error: Error, req: any) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const baseResponse = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  if (error instanceof CustomError) {
    return {
      ...baseResponse,
      code: error.code,
      statusCode: error.statusCode,
      ...(isDevelopment && { stack: error.stack }),
    };
  }

  return {
    ...baseResponse,
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    statusCode: 500,
    ...(isDevelopment && { stack: error.stack }),
  };
}; 