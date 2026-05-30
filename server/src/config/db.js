import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let cachedPool = null;

export const getPool = () => {
  if (cachedPool) {
    return cachedPool;
  }

  const connectionString = process.env.DATABASE_URL;
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

  const poolConfig = connectionString
    ? { connectionString }
    : DB_HOST && DB_PORT && DB_NAME && DB_USER && DB_PASSWORD
      ? {
          host: DB_HOST,
          port: Number(DB_PORT),
          database: DB_NAME,
          user: DB_USER,
          password: DB_PASSWORD,
        }
      : null;

  if (!poolConfig) {
    throw new Error('Database env vars are missing. Set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD in server/.env.');
  }

  cachedPool = new Pool({
    ...poolConfig,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  cachedPool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
  });

  return cachedPool;
};

export const query = (text, params = []) => getPool().query(text, params);