import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const sslConfig = process.env.NODE_ENV === 'production'
  ? {
      rejectUnauthorized: true,
      // Set DB_CA_CERT env var to your database CA certificate in production
      ...(process.env.DB_CA_CERT && { ca: process.env.DB_CA_CERT }),
    }
  : false;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000, // Kill queries running longer than 10s
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
