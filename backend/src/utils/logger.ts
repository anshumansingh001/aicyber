import winston from 'winston';
import config from '../config';

const { logging, app } = config;

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: logging.level,
  format: app.nodeEnv === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { 
    service: 'cybersecurity-platform',
    version: app.apiVersion,
    environment: app.nodeEnv
  },
  transports: [
    new winston.transports.File({ 
      filename: logging.errorFilePath, 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: logging.filePath 
    }),
  ],
});

// Add console transport for non-production environments
if (app.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: developmentFormat
  }));
}

// Create a stream object for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Export logger instance
export default logger;

// Export convenience methods
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta); 