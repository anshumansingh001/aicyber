import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../config';
import { UserRepository, UserRow } from '../../repositories/UserRepository';
import { AuditLogRepository } from '../../repositories/AuditLogRepository';
import { AuthenticationError, ConflictError, ValidationError } from '../../utils/errors';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

export class AuthService {
  private userRepo: UserRepository;
  private auditRepo: AuditLogRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.auditRepo = new AuditLogRepository();
  }

  async register(email: string, password: string, name: string): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
    const user = await this.userRepo.create({ email, password_hash: passwordHash, name, role: 'user' });
    const tokens = this.generateTokens(user);

    await this.auditRepo.log('user.register', '/api/auth/register', user.id);

    return { user: this.toSafeUser(user), tokens };
  }

  async login(email: string, password: string, ipAddress?: string): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AuthenticationError('Invalid email or password');
    }

    await this.userRepo.updateLastLogin(user.id);
    const tokens = this.generateTokens(user);

    await this.auditRepo.log('user.login', '/api/auth/login', user.id, ipAddress);

    return { user: this.toSafeUser(user), tokens };
  }

  async refreshToken(refreshTokenValue: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshTokenValue, config.security.jwtSecret) as AuthPayload & { type: string };
      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid refresh token');
      }

      const user = await this.userRepo.findById(decoded.userId);
      if (!user || !user.is_active) {
        throw new AuthenticationError('User not found or inactive');
      }

      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof AuthenticationError) throw err;
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    await this.userRepo.update(userId, { password_hash: passwordHash });
    await this.auditRepo.log('user.password_change', '/api/auth/change-password', userId);
  }

  verifyAccessToken(token: string): AuthPayload {
    try {
      const decoded = jwt.verify(token, config.security.jwtSecret) as AuthPayload & { type: string };
      if (decoded.type !== 'access') {
        throw new AuthenticationError('Invalid access token');
      }
      return { userId: decoded.userId, email: decoded.email, role: decoded.role };
    } catch (err) {
      if (err instanceof AuthenticationError) throw err;
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  private generateTokens(user: UserRow): TokenPair {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'access' },
      config.security.jwtSecret,
      { expiresIn: config.security.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'refresh', jti: crypto.randomUUID() },
      config.security.jwtSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken, expiresIn: config.security.jwtExpiresIn };
  }

  private toSafeUser(user: UserRow): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    };
  }
}
