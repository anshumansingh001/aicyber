import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'env.local') });

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  allowedOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
  slowDownWindowMs: number;
  slowDownDelayAfter: number;
  slowDownDelayMs: number;
}

export interface LoggingConfig {
  level: string;
  format: string;
  filePath: string;
  errorFilePath: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiVersion: string;
  corsEnabled: boolean;
  compressionEnabled: boolean;
  helmetEnabled: boolean;
}

export interface AIConfig {
  openaiApiKey?: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
  ai: AIConfig;
}

const config: Config = {
  app: {
    port: Number(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
    corsEnabled: process.env.CORS_ENABLED !== 'false',
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'aicyber_platform',
    ...(process.env.DB_USERNAME && { username: process.env.DB_USERNAME }),
    ...(process.env.DB_PASSWORD && { password: process.env.DB_PASSWORD }),
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    db: Number(process.env.REDIS_DB) || 0,
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
    slowDownWindowMs: Number(process.env.SLOW_DOWN_WINDOW_MS) || 15 * 60 * 1000,
    slowDownDelayAfter: Number(process.env.SLOW_DOWN_DELAY_AFTER) || 50,
    slowDownDelayMs: Number(process.env.SLOW_DOWN_DELAY_MS) || 500,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    filePath: process.env.LOG_FILE_PATH || 'logs/combined.log',
    errorFilePath: process.env.LOG_ERROR_FILE_PATH || 'logs/error.log',
  },
  ai: {
    ...(process.env.OPENAI_API_KEY && { openaiApiKey: process.env.OPENAI_API_KEY }),
    modelName: process.env.AI_MODEL_NAME || 'gpt-4',
    maxTokens: Number(process.env.AI_MAX_TOKENS) || 2000,
    temperature: Number(process.env.AI_TEMPERATURE) || 0.7,
  },
};

export default config; 