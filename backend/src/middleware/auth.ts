import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/AuthService';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

const authService = new AuthService();

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyAccessToken(token);

  (req as any).user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  next();
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      throw new AuthenticationError('Not authenticated');
    }

    if (!roles.includes(user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    next();
  };
};
