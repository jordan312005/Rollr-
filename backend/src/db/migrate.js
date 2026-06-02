// Runs schema.sql against the configured Postgres (Supabase) database.
//   npm run db:migrate
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';
import { checkConfig } from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const problems = checkConfig();
  if (problems.length) {
    console.warn('\n⚠️  Config still has placeholder values:');
    problems.forEach((p) => console.warn('   - ' + p));
    console.warn('   Migration will fail until DATABASE_URL points at a real database.\n');
  }

  const sql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
  console.log('▶  Applying schema.sql ...');
  await pool.query(sql);
  console.log('✅ Schema applied successfully.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
