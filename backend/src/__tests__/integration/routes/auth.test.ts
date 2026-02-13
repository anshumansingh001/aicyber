import request from 'supertest';
import app from '../../../app';

jest.mock('../../../services/database/db', () => {
  const mockKnex = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: '1', email: 'test@test.com', name: 'Test', role: 'user', is_active: true }]),
    count: jest.fn().mockResolvedValue([{ total: 0 }]),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
  });
  return { default: mockKnex };
});

jest.mock('../../../services/database/DatabaseService', () => ({
  DatabaseServiceFactory: { create: () => ({ healthCheck: jest.fn().mockResolvedValue(true), getConnectionInfo: jest.fn().mockReturnValue({}) }) },
}));

jest.mock('../../../services/queue/QueueService', () => ({
  QueueServiceFactory: { create: () => ({ healthCheck: jest.fn().mockResolvedValue(true), getQueueStats: jest.fn().mockResolvedValue({}) }) },
}));

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' });
      expect(response.status).toBe(400);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: 'password123', name: 'Test' });
      expect(response.status).toBe(400);
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'short', name: 'Test' });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});
      expect(response.status).toBe(400);
    });
  });

  describe('Protected routes without auth', () => {
    it('should reject unauthenticated access to /api/security', async () => {
      const response = await request(app).get('/api/security/posture/assess');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated access to /api/ai-security', async () => {
      const response = await request(app).get('/api/ai-security/status');
      expect(response.status).toBe(401);
    });
  });
});
