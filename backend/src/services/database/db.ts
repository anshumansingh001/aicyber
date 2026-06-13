import knex, { Knex } from 'knex';
import config from '../../config';

const connection: Knex.PgConnectionConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  ...(config.database.username && { user: config.database.username }),
  ...(config.database.password && { password: config.database.password }),
};

const knexInstance: Knex = knex({
  client: 'pg',
  connection,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: '../../../migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: '../../../seeds',
  },
});

export default knexInstance;
