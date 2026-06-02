// Centralised configuration. Loads .env once and validates required values.
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load backend/.env regardless of where the process is started from.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = (key, fallback = undefined) => {
  const val = process.env[key] ?? fallback;
  return val;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: required('DATABASE_URL'),
  supabase: {
    url: required('SUPABASE_URL'),
    anonKey: required('SUPABASE_ANON_KEY'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },
  admin: {
    email: required('ADMIN_EMAIL', 'admin@rollr.test'),
    password: required('ADMIN_PASSWORD', 'ChangeMe_Admin123!'),
    jwtSecret: required('ADMIN_JWT_SECRET', 'dev-only-admin-secret-change-me'),
    jwtExpiresIn: required('ADMIN_JWT_EXPIRES_IN', '12h'),
  },
  seed: {
    mechanicEmail: required('SEED_MECHANIC_EMAIL', 'mechanic@rollr.test'),
    mechanicPassword: required('SEED_MECHANIC_PASSWORD', 'ChangeMe_Mech123!'),
    customerEmail: required('SEED_CUSTOMER_EMAIL', 'customer@rollr.test'),
    customerPassword: required('SEED_CUSTOMER_PASSWORD', 'ChangeMe_Cust123!'),
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

/**
 * Warn loudly (but don't crash) when placeholder values are still in place.
 * Returns the list of missing/placeholder keys.
 */
export function checkConfig() {
  const problems = [];
  if (!config.databaseUrl || config.databaseUrl.includes('localhost:5432/postgres')) {
    problems.push('DATABASE_URL (still a placeholder)');
  }
  if (!config.supabase.url || config.supabase.url.includes('your-project-ref')) {
    problems.push('SUPABASE_URL (still a placeholder)');
  }
  if (!config.supabase.serviceRoleKey || config.supabase.serviceRoleKey.includes('your-service-role-key')) {
    problems.push('SUPABASE_SERVICE_ROLE_KEY (still a placeholder)');
  }
  return problems;
}
