/**
 * Migration: add reset_code and reset_code_expires columns to users table
 * Run with: node src/db/migrations/add-reset-code-columns.mjs
 */
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('Adding reset_code columns to users table...');

  await client.execute(`ALTER TABLE users ADD COLUMN reset_code TEXT`)
    .catch(e => {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log('  reset_code already exists — skipping');
      } else throw e;
    });

  await client.execute(`ALTER TABLE users ADD COLUMN reset_code_expires TEXT`)
    .catch(e => {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log('  reset_code_expires already exists — skipping');
      } else throw e;
    });

  console.log('Migration complete.');
  process.exit(0);
}

main().catch(e => { console.error('Migration failed:', e); process.exit(1); });
