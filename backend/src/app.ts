import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Import configuration and utilities
import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders } from './middleware/securityHeaders';
import { requestLogger } from './middleware/requestLogger';

// Import route modules
import healthRoutes from './routes/health';
import securityRoutes from './routes/security';
import aiSecurityRoutes from './routes/ai-security';

// Create Express app
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

// Security routes
app.use('/api/security', securityRoutes);

// AI-Powered Security routes
app.use('/api/ai-security', aiSecurityRoutes);

// Placeholder routes (to be implemented)
app.use('/api/auth', (_req, res) => {
  res.json({ message: 'Auth routes - Coming soon' });
});

app.use('/api/users', (_req, res) => {
  res.json({ message: 'User routes - Coming soon' });
});

// API documentation route
app.get('/api/docs', (_req, res) => {
  res.json({
    message: 'Cybersecurity Platform API',
    version: config.app.apiVersion,
    environment: config.app.nodeEnv,
    endpoints: {
      auth: '/api/auth',
      security: '/api/security',
      users: '/api/users',
      health: '/health'
    },
    documentation: '/api/docs/swagger'
  });
});

// Error handling middleware
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.use(errorHandler);

export default app; 