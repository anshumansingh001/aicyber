import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';
import db from '../services/database/db';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.get('/', authorize('admin'), asyncHandler(async (_req: Request, res: Response) => {
  const orgs = await db('organizations').orderBy('created_at', 'desc');
  res.json({ success: true, data: orgs });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const org = await db('organizations').where('id', req.params['id']).first();
  if (!org) throw new NotFoundError('Organization not found');
  res.json({ success: true, data: org });
}));

router.post('/', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { name, plan, settings } = req.body;
  const [org] = await db('organizations').insert({
    name,
    plan: plan || 'free',
    settings: JSON.stringify(settings || {}),
  }).returning('*');
  res.status(201).json({ success: true, data: org });
}));

router.put('/:id/settings', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;
  const [org] = await db('organizations')
    .where('id', req.params['id'])
    .update({ settings: JSON.stringify(settings), updated_at: new Date() })
    .returning('*');
  if (!org) throw new NotFoundError('Organization not found');
  res.json({ success: true, data: org });
}));

router.post('/:id/invite', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const [invite] = await db('organization_invites').insert({
    organization_id: req.params['id'],
    email,
    role: role || 'user',
    invited_by: (req as any).user.id,
  }).returning('*');
  res.status(201).json({ success: true, data: invite });
}));

export default router;
