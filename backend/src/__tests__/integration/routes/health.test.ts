import request from 'supertest';
import app from '../../../app';

// Mock database and queue services for integration tests
jest.mock('../../../services/database/DatabaseService', () => ({
  DatabaseServiceFactory: {
    create: () => ({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      getConnectionInfo: jest.fn().mockReturnValue({ host: 'localhost', port: 5432, database: 'test', connected: true }),
      healthCheck: jest.fn().mockResolvedValue(true),
    }),
  },
}));

jest.mock('../../../services/queue/QueueService', () => ({
  QueueServiceFactory: {
    create: () => ({
      healthCheck: jest.fn().mockResolvedValue(true),
      getQueueStats: jest.fn().mockResolvedValue({}),
      closeAll: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('../../../services/database/db', () => {
  return { default: jest.fn() };
});

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBeLessThanOrEqual(503);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health info', async () => {
      const response = await request(app).get('/health/detailed');
      expect(response.status).toBeLessThanOrEqual(503);
      expect(response.body).toHaveProperty('success');
    });
  });
});
