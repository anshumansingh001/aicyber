import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler';
import db from '../services/database/db';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const keys = await db('api_keys')
    .where('user_id', user.id)
    .select('id', 'name', 'prefix', 'permissions', 'rate_limit', 'last_used_at', 'expires_at', 'created_at')
    .orderBy('created_at', 'desc');
  res.json({ success: true, data: keys });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, permissions, rateLimit, expiresInDays } = req.body;

  const rawKey = `aicyber_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const prefix = rawKey.substring(0, 12);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000)
    : new Date(Date.now() + 365 * 86400000);

  const [apiKey] = await db('api_keys').insert({
    user_id: user.id,
    key_hash: keyHash,
    prefix,
    name: name || 'API Key',
    permissions: JSON.stringify(permissions || ['read']),
    rate_limit: rateLimit || 1000,
    expires_at: expiresAt,
  }).returning('*');

  res.status(201).json({
    success: true,
    data: { ...apiKey, key: rawKey },
    message: 'Store this key securely — it will not be shown again',
  });
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const count = await db('api_keys').where({ id: req.params['id'], user_id: user.id }).del();
  if (count === 0) throw new NotFoundError('API key not found');
  res.json({ success: true, message: 'API key revoked' });
}));

export default router;
