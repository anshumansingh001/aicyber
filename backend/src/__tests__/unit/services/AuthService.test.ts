import { AuthService } from '../../../services/auth/AuthService';

// Mock the repositories
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../repositories/AuditLogRepository');
jest.mock('../../../services/database/db', () => {
  return { default: {} };
});

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('verifyAccessToken', () => {
    it('should throw for invalid token', () => {
      expect(() => authService.verifyAccessToken('invalid-token')).toThrow('Invalid or expired access token');
    });

    it('should throw for empty token', () => {
      expect(() => authService.verifyAccessToken('')).toThrow();
    });
  });

  describe('register', () => {
    it('should reject short passwords', async () => {
      const { UserRepository } = require('../../../repositories/UserRepository');
      UserRepository.prototype.findByEmail = jest.fn().mockResolvedValue(null);

      await expect(authService.register('test@test.com', 'short', 'Test')).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });
  });
});
