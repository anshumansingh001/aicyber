import { Pool } from 'pg';
import config from '../../config';
import logger from '../../utils/logger';
import { BaseDatabaseService } from './DatabaseService';

export class PostgresDatabaseService extends BaseDatabaseService {
  private pool: Pool;

  constructor() {
    super();
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.name,
      ssl: config.database.ssl,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
      this.setConnected(true);
    } catch (error) {
      logger.error('Database connection failed', error);
      this.setConnected(false);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.setConnected(false);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }
}
