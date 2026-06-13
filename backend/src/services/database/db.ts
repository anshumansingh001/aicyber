import knex, { Knex } from 'knex';
import config from '../../config';

const knexInstance: Knex = knex({
  client: 'pg',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.name,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  },
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
