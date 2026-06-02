// ──────────────────────────────────────────────────────────────────────────
// Seed script — creates 1 admin, 1 mechanic, 1 customer and prints their
// credentials. Also syncs the vehicle_types table from the config file.
//
//   npm run db:seed          (run `npm run db:migrate` first)
//
// Customer & mechanic accounts are created in Supabase Auth (via the service
// role key) AND mirrored into the `users` table with the correct role.
// The admin uses hardcoded credentials (ADMIN_EMAIL/ADMIN_PASSWORD) and is
// only mirrored into `users` for completeness.
// ──────────────────────────────────────────────────────────────────────────
import { pool } from './pool.js';
import { supabaseAdmin } from '../config/supabase.js';
import { config, checkConfig } from '../config/index.js';
import { VEHICLE_TYPES } from '../config/vehicleTypes.js';

async function roleId(name) {
  const { rows } = await pool.query('select id from roles where name = $1', [name]);
  if (!rows[0]) throw new Error(`Role "${name}" not found — did you run db:migrate?`);
  return rows[0].id;
}

async function syncVehicleTypes() {
  for (const v of VEHICLE_TYPES) {
    await pool.query(
      `insert into vehicle_types (key, label, is_active, sort_order)
       values ($1, $2, $3, $4)
       on conflict (key) do update set label = excluded.label,
         is_active = excluded.is_active, sort_order = excluded.sort_order`,
      [v.key, v.label, v.isActive, v.sortOrder]
    );
  }
  console.log(`✅ Synced ${VEHICLE_TYPES.length} vehicle types.`);
}

/** Create (or fetch) a Supabase auth user, then upsert into users table. */
async function createAuthUser({ email, password, fullName, role }) {
  // Try to create; if it already exists, look it up instead (idempotent seed).
  let userId;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error) {
    if (/already.*registered|exists/i.test(error.message)) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      if (!existing) throw error;
      userId = existing.id;
      // Make sure the password matches what we print.
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    } else {
      throw error;
    }
  } else {
    userId = data.user.id;
  }

  await pool.query(
    `insert into users (id, email, full_name, role_id)
     values ($1, $2, $3, $4)
     on conflict (id) do update set email = excluded.email,
       full_name = excluded.full_name, role_id = excluded.role_id`,
    [userId, email, fullName, await roleId(role)]
  );
  return userId;
}

/** Admin lives only in our users table (auth is hardcoded creds). */
async function upsertAdminRow({ email, fullName }) {
  const { rows } = await pool.query('select id from users where email = $1', [email]);
  if (rows[0]) {
    await pool.query('update users set full_name = $2, role_id = $3 where id = $1', [
      rows[0].id, fullName, await roleId('admin'),
    ]);
    return rows[0].id;
  }
  const { rows: inserted } = await pool.query(
    `insert into users (email, full_name, role_id) values ($1, $2, $3) returning id`,
    [email, fullName, await roleId('admin')]
  );
  return inserted[0].id;
}

async function main() {
  const problems = checkConfig();
  if (problems.length) {
    console.warn('\n⚠️  Config still has placeholder values:');
    problems.forEach((p) => console.warn('   - ' + p));
    console.warn('   Seeding requires real Supabase + DATABASE_URL values.\n');
  }

  await syncVehicleTypes();

  const adminId = await upsertAdminRow({
    email: config.admin.email,
    fullName: 'Rollr Admin',
  });

  const mechId = await createAuthUser({
    email: config.seed.mechanicEmail,
    password: config.seed.mechanicPassword,
    fullName: 'Test Mechanic',
    role: 'mechanic',
  });

  const custId = await createAuthUser({
    email: config.seed.customerEmail,
    password: config.seed.customerPassword,
    fullName: 'Test Customer',
    role: 'customer',
  });

  console.log('\n──────────────────────────────────────────────');
  console.log('🌱  Rollr seed complete — test credentials');
  console.log('──────────────────────────────────────────────');
  console.log('ADMIN     (hardcoded login)');
  console.log('  email:    ' + config.admin.email);
  console.log('  password: ' + config.admin.password);
  console.log('  id:       ' + adminId);
  console.log('');
  console.log('MECHANIC  (login only — issued by admin)');
  console.log('  email:    ' + config.seed.mechanicEmail);
  console.log('  password: ' + config.seed.mechanicPassword);
  console.log('  id:       ' + mechId);
  console.log('');
  console.log('CUSTOMER  (self-registration enabled)');
  console.log('  email:    ' + config.seed.customerEmail);
  console.log('  password: ' + config.seed.customerPassword);
  console.log('  id:       ' + custId);
  console.log('──────────────────────────────────────────────\n');

  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
