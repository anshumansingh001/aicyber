import { Router, Request, Response } from 'express';
import { asyncHandler, successResponse } from '../middleware/errorHandler';
import { HealthStatus, HealthServiceStatus } from '../types/global';
import config from '../config';
import { DatabaseServiceFactory } from '../services/database/DatabaseService';
import { QueueServiceFactory } from '../services/queue/QueueService';
import logger from '../utils/logger';

const router = Router();

// Initialize services
const databaseService = DatabaseServiceFactory.create();
const queueService = QueueServiceFactory.create();

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Check database health
  const dbHealthStart = Date.now();
  const dbHealthy = await databaseService.healthCheck();
  const dbResponseTime = Date.now() - dbHealthStart;
  
  // Check queue health
  const queueHealthStart = Date.now();
  const queueHealthy = await queueService.healthCheck();
  const queueResponseTime = Date.now() - queueHealthStart;
  
  // Check AI service health (placeholder)
  const aiHealthStart = Date.now();
  const aiHealthy = config.ai.openaiApiKey ? true : false;
  const aiResponseTime = Date.now() - aiHealthStart;
  
  // Determine overall status
  const allHealthy = dbHealthy && queueHealthy && aiHealthy;
  const status: 'healthy' | 'unhealthy' | 'degraded' = allHealthy ? 'healthy' : 
    (dbHealthy || queueHealthy || aiHealthy) ? 'degraded' : 'unhealthy';
  
  // Build service status objects
  const databaseStatus: HealthServiceStatus = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    responseTime: dbResponseTime,
    lastChecked: new Date(),
  };
  
  const redisStatus: HealthServiceStatus = {
    status: queueHealthy ? 'healthy' : 'unhealthy',
    responseTime: queueResponseTime,
    lastChecked: new Date(),
  };
  
  const aiStatus: HealthServiceStatus = {
    status: aiHealthy ? 'healthy' : 'unhealthy',
    responseTime: aiResponseTime,
    lastChecked: new Date(),
  };
  
  // Build health status response
  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date(),
    uptime: process.uptime(),
    version: config.app.apiVersion,
    environment: config.app.nodeEnv,
    services: {
      database: databaseStatus,
      redis: redisStatus,
      ai: aiStatus,
    },
  };
  
  const totalResponseTime = Date.now() - startTime;
  
  // Log health check
  logger.info('Health check performed', {
    status,
    responseTime: `${totalResponseTime}ms`,
    services: {
      database: databaseStatus.status,
      redis: redisStatus.status,
      ai: aiStatus.status,
    },
    requestId: (req as any).requestId,
  });
  
  // Return appropriate status code based on health
  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  
  return successResponse(res, healthStatus, 'Health check completed', statusCode);
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Get detailed service information
  const dbInfo = databaseService.getConnectionInfo();
  const queueStats = await queueService.getQueueStats();
  
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    version: config.app.apiVersion,
    environment: config.app.nodeEnv,
    services: {
      database: {
        ...dbInfo,
        health: await databaseService.healthCheck(),
      },
      redis: {
        health: await queueService.healthCheck(),
        queues: queueStats,
      },
      ai: {
        configured: !!config.ai.openaiApiKey,
        model: config.ai.modelName,
        health: !!config.ai.openaiApiKey,
      },
    },
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    },
    responseTime: Date.now() - startTime,
  };
  
  logger.debug('Detailed health check performed', {
    responseTime: `${detailedHealth.responseTime}ms`,
    requestId: (req as any).requestId,
  });
  
  return successResponse(res, detailedHealth, 'Detailed health check completed');
}));

// Service-specific health checks
router.get('/database', asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const healthy = await databaseService.healthCheck();
  const responseTime = Date.now() - startTime;
  
  const dbHealth = {
    status: healthy ? 'healthy' : 'unhealthy',
    responseTime,
    connection: databaseService.getConnectionInfo(),
    timestamp: new Date(),
  };
  
  return successResponse(
    res, 
    dbHealth, 
    'Database health check completed',
    healthy ? 200 : 503
  );
}));

router.get('/redis', asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const healthy = await queueService.healthCheck();
  const responseTime = Date.now() - startTime;
  
  const redisHealth = {
    status: healthy ? 'healthy' : 'unhealthy',
    responseTime,
    queues: await queueService.getQueueStats(),
    timestamp: new Date(),
  };
  
  return successResponse(
    res, 
    redisHealth, 
    'Redis health check completed',
    healthy ? 200 : 503
  );
}));

router.get('/ai', asyncHandler(async (_req: Request, res: Response) => {
  const aiHealth = {
    status: config.ai.openaiApiKey ? 'healthy' : 'unhealthy',
    configured: !!config.ai.openaiApiKey,
    model: config.ai.modelName,
    timestamp: new Date(),
  };
  
  return successResponse(
    res, 
    aiHealth, 
    'AI service health check completed',
    config.ai.openaiApiKey ? 200 : 503
  );
}));

export default router; 