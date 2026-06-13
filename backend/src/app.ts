import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders } from './middleware/securityHeaders';
import { requestLogger } from './middleware/requestLogger';
import { authenticate } from './middleware/auth';

import healthRoutes from './routes/health';
import securityRoutes from './routes/security';
import aiSecurityRoutes from './routes/ai-security';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import complianceRoutes from './routes/compliance';
import analyticsRoutes from './routes/analytics';
import incidentRoutes from './routes/incidents';
import organizationRoutes from './routes/organizations';
import apiKeysRoutes from './routes/api-keys';
import alertRulesRoutes from './routes/alert-rules';
import { setupSwagger } from './routes/api-docs';

const app = express();

// Security middleware
if (config.app.helmetEnabled) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: config.security.slowDownWindowMs,
  delayAfter: config.security.slowDownDelayAfter,
  delayMs: () => config.security.slowDownDelayMs
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
if (config.app.corsEnabled) {
  app.use(cors());
}

// Compression middleware
if (config.app.compressionEnabled) {
  app.use(compression());
}

// Custom security headers
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// Health check route (no authentication required)
app.use('/health', healthRoutes);

// Auth routes (no authentication required)
app.use('/api/auth', authRoutes);

// Swagger API docs
setupSwagger(app);

// Protected routes
app.use('/api/security', authenticate, securityRoutes);
app.use('/api/ai-security', authenticate, aiSecurityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/compliance', authenticate, complianceRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/incidents', authenticate, incidentRoutes);
app.use('/api/organizations', authenticate, organizationRoutes);
app.use('/api/keys', authenticate, apiKeysRoutes);
app.use('/api/alert-rules', authenticate, alertRulesRoutes);

// API info endpoint
app.get('/api/docs-info', (_req, res) => {
  res.json({
    message: 'Cybersecurity Platform API',
    version: config.app.apiVersion,
    environment: config.app.nodeEnv,
    endpoints: {
      auth: '/api/auth',
      security: '/api/security',
      aiSecurity: '/api/ai-security',
      users: '/api/users',
      compliance: '/api/compliance',
      analytics: '/api/analytics',
      incidents: '/api/incidents',
      organizations: '/api/organizations',
      health: '/health',
      docs: '/api/docs'
    },
  });
});

// Error handling middleware
app.use('*', (_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

export default app;
