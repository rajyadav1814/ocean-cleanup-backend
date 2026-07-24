import './loadEnv.js';
import { Pool } from 'pg';

let pool = null;

function getConnectionString() {
  return process.env.DATABASE_URL || null;
}

function getPool() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!pool) {
    const isProduction = process.env.NODE_ENV === 'production';
    pool = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    });
  }

  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function testConnection() {
  const client = await getPool().connect();
  try {
    const result = await client.query('SELECT NOW() AS now');
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default {
  query,
  testConnection,
  closeConnection
};
