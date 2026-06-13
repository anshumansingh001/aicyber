import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRepository } from '../repositories/UserRepository';
import { NotFoundError } from '../utils/errors';

const router = Router();
const userRepo = new UserRepository();

router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await userRepo.findById((req as any).user.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    },
  });
}));

router.put('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name) updateData['name'] = name;
  if (email) updateData['email'] = email;

  const user = await userRepo.update((req as any).user.id, updateData);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}));

router.get('/', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 25;
  const result = await userRepo.findAll({ page, limit });
  const safeData = result.data.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.is_active,
    lastLogin: u.last_login,
    createdAt: u.created_at,
  }));
  res.json({ success: true, data: safeData, pagination: result.pagination });
}));

router.put('/:id/role', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['user', 'analyst', 'admin'].includes(role)) {
    res.status(400).json({ success: false, error: 'Invalid role' });
    return;
  }
  const user = await userRepo.update(req.params['id'] as string, { role });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json({ success: true, data: { id: user.id, email: user.email, name: user.name, role: user.role } });
}));

router.put('/:id/active', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  await userRepo.setActive(req.params['id'] as string, isActive);
  res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}` });
}));

export default router;
