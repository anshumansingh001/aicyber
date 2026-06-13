import {
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  isOperationalError,
  createValidationError,
  createAuthenticationError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
} from '../../../utils/errors';

describe('Error Classes', () => {
  describe('CustomError', () => {
    it('should create error with statusCode', () => {
      const error = new CustomError('test', 400, 'TEST');
      expect(error.message).toBe('test');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('AuthenticationError', () => {
    it('should create 401 error with default message', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication failed');
    });
  });

  describe('AuthorizationError', () => {
    it('should create 403 error', () => {
      const error = new AuthorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error', () => {
      const error = new NotFoundError('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
    });
  });

  describe('RateLimitError', () => {
    it('should create 429 error', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
    });
  });

  describe('InternalServerError', () => {
    it('should create 500 error', () => {
      const error = new InternalServerError();
      expect(error.statusCode).toBe(500);
    });
  });

  describe('isOperationalError', () => {
    it('should return true for CustomError', () => {
      expect(isOperationalError(new ValidationError('test'))).toBe(true);
    });

    it('should return false for regular Error', () => {
      expect(isOperationalError(new Error('test'))).toBe(false);
    });
  });

  describe('Factory Functions', () => {
    it('createValidationError', () => {
      const error = createValidationError('email', 'is required');
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('email');
    });

    it('createAuthenticationError', () => {
      const error = createAuthenticationError('Bad creds');
      expect(error.statusCode).toBe(401);
    });

    it('createNotFoundError', () => {
      const error = createNotFoundError('User');
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('User');
    });

    it('createConflictError', () => {
      const error = createConflictError('Email');
      expect(error.statusCode).toBe(409);
    });

    it('createRateLimitError with retryAfter', () => {
      const error = createRateLimitError(60);
      expect(error.message).toContain('60');
    });
  });
});
