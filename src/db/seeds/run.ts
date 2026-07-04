/**
 * Database Setup Script
 * Runs all migrations then seeds default data.
 * Run once after deployment or on new environments.
 *
 * Usage: npx tsx src/db/seeds/run.ts
 */

import { runMigrations } from '../migrations/runner';
import { seedPlanConfigs } from './planConfigs';

async function main() {
  console.log('=== Flowxiq Database Setup ===\n');

  console.log('Step 1: Running migrations...');
  await runMigrations();

  console.log('\nStep 2: Seeding plan configurations...');
  await seedPlanConfigs();

  console.log('\n✅ Database setup complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Database setup failed:', err);
  process.exit(1);
});
