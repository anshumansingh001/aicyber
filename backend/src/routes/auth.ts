import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth/AuthService';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError } from '../utils/errors';

const router = Router();
const authService = new AuthService();

const validate = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    throw new ValidationError(first?.msg ?? 'Validation failed');
  }
};

router.post(
  '/register',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  asyncHandler(async (req: Request, res: Response) => {
    validate(req);
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    res.status(201).json({ success: true, data: result });
  })
);

router.post(
  '/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  asyncHandler(async (req: Request, res: Response) => {
    validate(req);
    const { email, password } = req.body;
    const ipAddress = req.ip ?? req.socket.remoteAddress;
    const result = await authService.login(email, password, ipAddress);
    res.json({ success: true, data: result });
  })
);

router.post(
  '/refresh',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  asyncHandler(async (req: Request, res: Response) => {
    validate(req);
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: tokens });
  })
);

router.post(
  '/change-password',
  authenticate,
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  asyncHandler(async (req: Request, res: Response) => {
    validate(req);
    const { oldPassword, newPassword } = req.body;
    const user = (req as any).user;
    await authService.changePassword(user.id, oldPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  })
);

router.post('/logout', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
}));

export default router;
