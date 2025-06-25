import app from './app';
import config from './config';
import logger from './utils/logger';
import { Server } from 'http';

let server: Server | undefined;

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  if (server) {
    // Close server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Start server
const startServer = async (): Promise<Server> => {
  try {
    server = app.listen(config.app.port, () => {
      logger.info(`🚀 Cybersecurity Platform API running on port ${config.app.port}`);
      logger.info(`Environment: ${config.app.nodeEnv}`);
      logger.info(`API Version: ${config.app.apiVersion}`);
      logger.info(`Health check: http://localhost:${config.app.port}/health`);
      logger.info(`API docs: http://localhost:${config.app.port}/api/docs`);
      logger.info(`Queue dashboard: http://localhost:${config.app.port}/admin/queues`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

export { server }; 