// Supabase server clients.
import { createClient } from '@supabase/supabase-js';
import { config } from './index.js';

// Admin client — uses the SERVICE ROLE key. Server-side ONLY. Bypasses RLS.
// Used to create mechanic/customer accounts (seed) and to verify access tokens.
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Verify a Supabase access token (JWT) and return the auth user, or null.
 * @param {string} accessToken
 */
export async function getSupabaseUserFromToken(accessToken) {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return data.user;
}
