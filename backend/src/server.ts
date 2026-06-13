import app from './app';
import config from './config';
import logger from './utils/logger';
import { Server } from 'http';
import { initWebSocket } from './services/realtime/WebSocketService';
import { metricsEndpoint, metricsMiddleware } from './middleware/metrics';

let server: Server | undefined;

// Add metrics middleware
app.use(metricsMiddleware);

// Prometheus metrics endpoint
app.get('/metrics', metricsEndpoint);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

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
      logger.info(`Cybersecurity Platform API running on port ${config.app.port}`);
      logger.info(`Environment: ${config.app.nodeEnv}`);
      logger.info(`API Version: ${config.app.apiVersion}`);
      logger.info(`Health check: http://localhost:${config.app.port}/health`);
      logger.info(`API docs: http://localhost:${config.app.port}/api/docs`);
      logger.info(`Metrics: http://localhost:${config.app.port}/metrics`);
    });

    // Initialize WebSocket
    initWebSocket(server);
    logger.info('WebSocket server initialized on /ws');

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

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

startServer();

export { server };
