/**
 * Seed planConfigs table with Flowxiq's plan definitions.
 * Run with: node src/db/migrations/seed-plan-configs.mjs
 */
import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env manually (no dotenv dependency)
const envPath = resolve(__dirname, '../../../.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const i = line.indexOf('=');
    if (i > 0) envVars[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
}

const client = createClient({
  url:       envVars.TURSO_DATABASE_URL,
  authToken: envVars.TURSO_AUTH_TOKEN,
});

const plans = [
  {
    id:            'plan-trial',
    plan_key:      'trial',
    display_name:  'Free Trial',
    description:   '14-day free trial with full access',
    price_monthly: 0,
    price_annual:  0,
    max_workers:   3,
    max_storage_gb: 1,
    features:      JSON.stringify(['analytics', 'audit_log']),
    is_public:     1,
    sort_order:    0,
  },
  {
    id:            'plan-professional',
    plan_key:      'professional',
    display_name:  'Professional',
    description:   'For growing businesses',
    price_monthly: 49,
    price_annual:  470,
    max_workers:   10,
    max_storage_gb: 10,
    features:      JSON.stringify(['analytics', 'audit_log', 'export_csv', 'export_pdf', 'reports', 'integrations']),
    is_public:     1,
    sort_order:    1,
  },
  {
    id:            'plan-business',
    plan_key:      'business',
    display_name:  'Business',
    description:   'For established operations',
    price_monthly: 99,
    price_annual:  950,
    max_workers:   50,
    max_storage_gb: 50,
    features:      JSON.stringify(['analytics', 'audit_log', 'export_csv', 'export_pdf', 'reports', 'integrations', 'api_access', 'ai_suggestions', 'advanced_integrations']),
    is_public:     1,
    sort_order:    2,
  },
  {
    id:            'plan-enterprise',
    plan_key:      'enterprise',
    display_name:  'Enterprise',
    description:   'Unlimited scale, priority support',
    price_monthly: 249,
    price_annual:  2390,
    max_workers:   null,
    max_storage_gb: null,
    features:      JSON.stringify(['analytics', 'audit_log', 'export_csv', 'export_pdf', 'reports', 'integrations', 'api_access', 'ai_suggestions', 'advanced_integrations', 'sso', 'custom_branding', 'priority_support']),
    is_public:     1,
    sort_order:    3,
  },
];

async function main() {
  console.log('Seeding planConfigs...');

  for (const plan of plans) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO plan_configs
              (id, plan_key, display_name, description, price_monthly, price_annual,
               max_workers, max_storage_gb, features, is_public, sort_order,
               created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
      args: [
        plan.id, plan.plan_key, plan.display_name, plan.description,
        plan.price_monthly, plan.price_annual,
        plan.max_workers, plan.max_storage_gb,
        plan.features, plan.is_public, plan.sort_order,
      ],
    });
    console.log(`  ✓ ${plan.display_name}`);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
