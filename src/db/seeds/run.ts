/**
 * Database Setup Script
 * Runs all migrations then seeds default data.
 * Run once after deployment or on new environments.
 *
 * Usage: npx tsx src/db/seeds/run.ts
 */

import { runMigrations } from '../migrations/runner';
import { seedPlanConfigs } from './planConfigs';
import { createClient } from '@libsql/client';
import { Platform } from '@/config';

/**
 * Ensure every active client company has at least a 'trial' subscription row.
 * This is a safety backfill — the proper path is creating a subscription during onboarding.
 */
async function backfillSubscriptions(): Promise<void> {
  const client = createClient({ url: Platform.db.url, authToken: Platform.db.authToken });
  const now = new Date().toISOString();
  const trialEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1-year trial

  const companies = await client.execute(
    `SELECT id, name FROM companies WHERE id != 'system-admin-tenant' AND deleted_at IS NULL`
  );

  for (const row of companies.rows) {
    const companyId = String(row[0]);
    const companyName = String(row[1]);

    const subs = await client.execute({
      sql: `SELECT id FROM subscriptions WHERE company_id = ? LIMIT 1`,
      args: [companyId],
    });

    if (subs.rows.length === 0) {
      await client.execute({
        sql: `INSERT INTO subscriptions (id, company_id, plan, status, trial_ends_at, created_at, updated_at)
              VALUES (?, ?, 'trial', 'active', ?, ?, ?)`,
        args: [`sub_${companyId}`, companyId, trialEnd, now, now],
      });
      console.log(`[seed] subscriptions: created trial for ${companyName} ✓`);
    } else {
      console.log(`[seed] subscriptions: ${companyName} already has subscription ✓`);
    }
  }

  client.close();
}

async function main() {
  console.log('=== Flowxiq Database Setup ===\n');

  console.log('Step 1: Running migrations...');
  await runMigrations();

  console.log('\nStep 2: Seeding plan configurations...');
  await seedPlanConfigs();

  console.log('\nStep 3: Backfilling subscriptions for existing companies...');
  await backfillSubscriptions();

  console.log('\n✅ Database setup complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Database setup failed:', err);
  process.exit(1);
});
