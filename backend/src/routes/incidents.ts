import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';
import db from '../services/database/db';
import { NotFoundError } from '../utils/errors';
import { getWebSocketService } from '../services/realtime/WebSocketService';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 25;
  const status = req.query['status'] as string | undefined;
  const offset = (page - 1) * limit;

  let query = db('incidents');
  let countQuery = db('incidents');
  if (status) {
    query = query.where('status', status);
    countQuery = countQuery.where('status', status);
  }

  const [countResult] = await countQuery.count('* as total');
  const total = Number(countResult?.['total'] ?? 0);
  const incidents = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

  res.json({
    success: true,
    data: incidents,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const incident = await db('incidents').where('id', req.params['id']).first();
  if (!incident) throw new NotFoundError('Incident not found');

  const notes = await db('incident_notes').where('incident_id', req.params['id']).orderBy('created_at', 'asc');
  res.json({ success: true, data: { ...incident, notes } });
}));

router.post('/', authorize('analyst', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const { title, description, severity, source } = req.body;
  const user = (req as any).user;

  const [incident] = await db('incidents').insert({
    title,
    description,
    severity: severity || 'medium',
    source,
    status: 'open',
    assigned_to: user.id,
    reported_by: user.id,
  }).returning('*');

  const ws = getWebSocketService();
  if (ws) ws.emitAlert({ type: 'incident_created', incident });

  res.status(201).json({ success: true, data: incident });
}));

router.put('/:id/status', authorize('analyst', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['open', 'investigating', 'contained', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid status' });
    return;
  }

  const updateData: Record<string, unknown> = { status, updated_at: new Date() };
  if (status === 'resolved' || status === 'closed') {
    updateData['resolved_at'] = new Date();
  }

  const [incident] = await db('incidents').where('id', req.params['id']).update(updateData).returning('*');
  if (!incident) throw new NotFoundError('Incident not found');

  res.json({ success: true, data: incident });
}));

router.post('/:id/notes', authorize('analyst', 'admin'), asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body;
  const user = (req as any).user;

  const [note] = await db('incident_notes').insert({
    incident_id: req.params['id'],
    user_id: user.id,
    content,
  }).returning('*');

  res.status(201).json({ success: true, data: note });
}));

export default router;
