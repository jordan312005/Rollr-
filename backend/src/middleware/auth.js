// Authentication + authorization middleware.
//
// Two token types are accepted on `Authorization: Bearer <token>`:
//   1. Admin JWT  — signed by THIS backend (admin uses hardcoded creds).
//   2. Supabase access token — for customer & mechanic accounts.
//
// On success, req.user = { id, email, role, source }.
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { getSupabaseUserFromToken } from '../config/supabase.js';
import { pool } from '../db/pool.js';
import { ApiError } from './errorHandler.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return null;
}

async function resolveRole(userId) {
  const { rows } = await pool.query(
    `select r.name as role from users u join roles r on r.id = u.role_id where u.id = $1`,
    [userId]
  );
  return rows[0]?.role || null;
}

export async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, 'Missing Authorization header');

    // 1) Try admin JWT first (cheap, local verification).
    try {
      const payload = jwt.verify(token, config.admin.jwtSecret);
      if (payload?.role === 'admin') {
        req.user = { id: payload.sub, email: payload.email, role: 'admin', source: 'admin-jwt' };
        return next();
      }
    } catch {
      // not an admin JWT — fall through to Supabase
    }

    // 2) Treat as Supabase access token.
    const supaUser = await getSupabaseUserFromToken(token);
    if (!supaUser) throw new ApiError(401, 'Invalid or expired token');

    // Look up role. Customers are auto-provisioned on first contact; mechanics
    // must already exist (created by admin) — they are never auto-created here.
    let role = await resolveRole(supaUser.id);
    if (!role) {
      // Auto-provision as customer (self-registration path).
      const { rows } = await pool.query('select id from roles where name = $1', ['customer']);
      await pool.query(
        `insert into users (id, email, full_name, role_id)
         values ($1, $2, $3, $4)
         on conflict (id) do nothing`,
        [supaUser.id, supaUser.email, supaUser.user_metadata?.full_name || null, rows[0].id]
      );
      role = 'customer';
    }

    req.user = { id: supaUser.id, email: supaUser.email, role, source: 'supabase' };
    return next();
  } catch (err) {
    return next(err);
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient role'));
    }
    next();
  };
}
