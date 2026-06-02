import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let cachedPool = null;

export const getPool = () => {
  if (cachedPool) {
    return cachedPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Set DATABASE_URL in server/.env.');
  }

  const poolConfig = { connectionString };

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