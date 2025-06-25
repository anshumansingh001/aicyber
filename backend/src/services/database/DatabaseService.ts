import config from '../../config';
import logger from '../../utils/logger';
import { DatabaseConnection } from '../../types/global';

export interface DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionInfo(): DatabaseConnection;
  healthCheck(): Promise<boolean>;
}

export abstract class BaseDatabaseService implements DatabaseService {
  protected connected: boolean = false;
  protected connectionInfo: DatabaseConnection;

  constructor() {
    this.connectionInfo = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      connected: false,
    };
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionInfo(): DatabaseConnection {
    const connectionInfo: DatabaseConnection = {
      ...this.connectionInfo,
      connected: this.connected,
    };
    
    if (this.connected) {
      connectionInfo.lastConnected = new Date();
    }
    
    return connectionInfo;
  }

  protected setConnected(status: boolean): void {
    this.connected = status;
    this.connectionInfo.connected = status;
    
    if (status) {
      logger.info('Database connected successfully', {
        host: this.connectionInfo.host,
        port: this.connectionInfo.port,
        database: this.connectionInfo.database,
      });
    } else {
      logger.warn('Database disconnected');
    }
  }
}

// Placeholder for actual database implementation
export class MockDatabaseService extends BaseDatabaseService {
  async connect(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.setConnected(true);
  }

  async disconnect(): Promise<void> {
    // Simulate disconnection delay
    await new Promise(resolve => setTimeout(resolve, 50));
    this.setConnected(false);
  }

  async healthCheck(): Promise<boolean> {
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 10));
    return this.connected;
  }
}

// Database service factory
export class DatabaseServiceFactory {
  static create(): DatabaseService {
    // For now, return mock service
    // In the future, this could return PostgreSQL, MongoDB, etc.
    return new MockDatabaseService();
  }
} 