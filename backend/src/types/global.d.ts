declare module 'hpp';
declare module 'xss-clean';
declare module 'express-mongo-sanitize'; 

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      API_VERSION?: string;
      
      // Database
      DB_HOST?: string;
      DB_PORT?: string;
      DB_NAME?: string;
      DB_USERNAME?: string;
      DB_PASSWORD?: string;
      DB_SSL?: string;
      
      // Redis
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_PASSWORD?: string;
      REDIS_DB?: string;
      
      // Security
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      BCRYPT_ROUNDS?: string;
      ALLOWED_ORIGINS?: string;
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX?: string;
      SLOW_DOWN_WINDOW_MS?: string;
      SLOW_DOWN_DELAY_AFTER?: string;
      SLOW_DOWN_DELAY_MS?: string;
      
      // Logging
      LOG_LEVEL?: string;
      LOG_FORMAT?: string;
      LOG_FILE_PATH?: string;
      LOG_ERROR_FILE_PATH?: string;
      
      // AI
      OPENAI_API_KEY?: string;
      AI_MODEL_NAME?: string;
      AI_MAX_TOKENS?: string;
      AI_TEMPERATURE?: string;
      
      // Features
      CORS_ENABLED?: string;
      COMPRESSION_ENABLED?: string;
      HELMET_ENABLED?: string;
    }
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  path: string;
  method: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

// Security types
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  source: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MALWARE_DETECTED = 'malware_detected',
  DATA_BREACH = 'data_breach',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// AI Service types
export interface AIAnalysisResult {
  confidence: number;
  risk: SecuritySeverity;
  recommendations: string[];
  metadata: Record<string, any>;
}

export interface AnomalyDetectionResult extends AIAnalysisResult {
  anomalyScore: number;
  threshold: number;
  isAnomaly: boolean;
}

export interface NLPAnalysisResult extends AIAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  entities: string[];
  threats: string[];
}

// Queue types
export interface QueueJob {
  id: string;
  name: string;
  data: any;
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: number;
}

export interface QueueJobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

// Database types
export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  connected: boolean;
  lastConnected?: Date;
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: HealthServiceStatus;
    redis: HealthServiceStatus;
    ai: HealthServiceStatus;
  };
}

export interface HealthServiceStatus {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastChecked: Date;
}

// Request/Response augmentation
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    requestId?: string;
    startTime?: number;
  }
  
  interface Response {
    apiResponse?: <T>(data: T, message?: string) => void;
    apiError?: (error: string | AppError, statusCode?: number) => void;
  }
}

export {}; 