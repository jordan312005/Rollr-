// Auth business logic.
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { supabaseAdmin } from '../config/supabase.js';
import { pool } from '../db/pool.js';
import { ApiError } from '../middleware/errorHandler.js';

async function roleId(name) {
  const { rows } = await pool.query('select id from roles where name = $1', [name]);
  if (!rows[0]) throw new ApiError(500, `Role "${name}" missing — run db:migrate`);
  return rows[0].id;
}

/**
 * Customer self-registration. Creates a Supabase auth user (confirmed) and a
 * mirrored row in `users` with role=customer. Login itself happens client-side
 * via the Supabase SDK.
 */
export async function registerCustomer({ email, password, fullName }) {
  if (!email || !password) throw new ApiError(400, 'email and password are required');
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // MVP: skip email verification. TODO(Future): require confirmation.
    user_metadata: { full_name: fullName, role: 'customer' },
  });
  if (error) {
    if (/already.*registered|exists/i.test(error.message)) {
      throw new ApiError(409, 'An account with that email already exists');
    }
    throw new ApiError(400, error.message);
  }

  await pool.query(
    `insert into users (id, email, full_name, role_id) values ($1, $2, $3, $4)
     on conflict (id) do nothing`,
    [data.user.id, email, fullName || null, await roleId('customer')]
  );

  return { id: data.user.id, email, role: 'customer' };
}

/** Admin login with hardcoded credentials → returns a backend-signed JWT. */
export async function adminLogin({ email, password }) {
  if (email !== config.admin.email || password !== config.admin.password) {
    throw new ApiError(401, 'Invalid admin credentials');
  }
  // Find the admin users row for the id claim. This is best-effort: admin auth
  // must succeed even if the DB isn't reachable yet (creds are env-based).
  let sub = 'admin';
  try {
    const { rows } = await pool.query('select id from users where email = $1', [email]);
    if (rows[0]?.id) sub = rows[0].id;
  } catch (err) {
    console.warn('[adminLogin] users lookup skipped (db unavailable):', err.code || err.message);
  }

  const token = jwt.sign({ sub, email, role: 'admin' }, config.admin.jwtSecret, {
    expiresIn: config.admin.jwtExpiresIn,
  });
  return { token, user: { id: sub, email, role: 'admin' } };
}

/** Returns the canonical profile (id, email, role, full_name) for req.user. */
export async function getProfile(user) {
  if (user.role === 'admin') {
    return { id: user.id, email: user.email, role: 'admin', fullName: 'Rollr Admin' };
  }
  const { rows } = await pool.query(
    `select u.id, u.email, u.full_name, r.name as role
     from users u join roles r on r.id = u.role_id where u.id = $1`,
    [user.id]
  );
  if (!rows[0]) throw new ApiError(404, 'User profile not found');
  return {
    id: rows[0].id,
    email: rows[0].email,
    role: rows[0].role,
    fullName: rows[0].full_name,
  };
}
