// PostgreSQL connection pool (points at the Supabase Postgres database).
import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

// Supabase requires SSL. For local dev against a placeholder localhost DB we
// disable SSL; against Supabase hosts (db.*.supabase.co OR the *.pooler.supabase.com
// connection poolers) we enable it (relaxed cert check for MVP).
const isSupabase = /supabase\.(co|com)/.test(config.databaseUrl || '');

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected idle client error:', err.message);
});

export async function query(text, params) {
  return pool.query(text, params);
}
