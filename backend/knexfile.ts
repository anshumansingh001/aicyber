import dotenv from 'dotenv';
import path from 'path';
import type { Knex } from 'knex';

dotenv.config({ path: path.resolve(__dirname, 'env.local') });

const baseConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env['DB_HOST'] || 'localhost',
    port: Number(process.env['DB_PORT']) || 5432,
    user: process.env['DB_USERNAME'] || 'postgres',
    password: process.env['DB_PASSWORD'] || '',
    database: process.env['DB_NAME'] || 'aicyber_platform',
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    extension: 'ts',
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
    extension: 'ts',
  },
};

const config: Record<string, Knex.Config> = {
  development: { ...baseConfig },
  test: {
    ...baseConfig,
    connection: {
      ...(baseConfig.connection as Knex.PgConnectionConfig),
      database: process.env['DB_NAME'] || 'aicyber_platform_test',
    },
  },
  production: {
    ...baseConfig,
    pool: { min: 5, max: 30 },
  },
};

export default config;
