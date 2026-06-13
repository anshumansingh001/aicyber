import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';
import db from '../services/database/db';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const rules = await db('alert_rules').orderBy('created_at', 'desc');
  res.json({ success: true, data: rules });
}));

router.post('/', authorize('analyst', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const { name, description, condition, severity, enabled, notificationChannels } = req.body;
  const user = (req as any).user;

  const [rule] = await db('alert_rules').insert({
    name,
    description,
    condition: JSON.stringify(condition),
    severity: severity || 'medium',
    enabled: enabled !== false,
    notification_channels: JSON.stringify(notificationChannels || ['email']),
    created_by: user.id,
  }).returning('*');

  res.status(201).json({ success: true, data: rule });
}));

router.put('/:id', authorize('analyst', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const { name, description, condition, severity, enabled, notificationChannels } = req.body;

  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (name !== undefined) updateData['name'] = name;
  if (description !== undefined) updateData['description'] = description;
  if (condition !== undefined) updateData['condition'] = JSON.stringify(condition);
  if (severity !== undefined) updateData['severity'] = severity;
  if (enabled !== undefined) updateData['enabled'] = enabled;
  if (notificationChannels !== undefined) updateData['notification_channels'] = JSON.stringify(notificationChannels);

  const [rule] = await db('alert_rules').where('id', req.params['id']).update(updateData).returning('*');
  if (!rule) throw new NotFoundError('Alert rule not found');

  res.json({ success: true, data: rule });
}));

router.delete('/:id', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const count = await db('alert_rules').where('id', req.params['id']).del();
  if (count === 0) throw new NotFoundError('Alert rule not found');
  res.json({ success: true, message: 'Alert rule deleted' });
}));

export default router;
