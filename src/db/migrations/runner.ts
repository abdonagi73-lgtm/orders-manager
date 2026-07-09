/**
 * Database Migration Runner
 * Tracks and applies schema migrations against the Turso database.
 * Each migration is idempotent — safe to run multiple times.
 */

import { createClient } from '@libsql/client';
import { Platform } from '@/config';

function getClient() {
  return createClient({ url: Platform.db.url, authToken: Platform.db.authToken });
}

interface Migration {
  id: string;
  sql: string[];
}

// ─── Migrations ──────────────────────────────────────────────────────────────

const migrations: Migration[] = [
  {
    id: '001_soft_delete_columns',
    sql: [
      `ALTER TABLE companies   ADD COLUMN deleted_at TEXT`,
      `ALTER TABLE companies   ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE companies   ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users       ADD COLUMN deleted_at TEXT`,
      `ALTER TABLE users       ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users       ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE vendors     ADD COLUMN deleted_at TEXT`,
      `ALTER TABLE vendors     ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE orders      ADD COLUMN deleted_at TEXT`,
      `ALTER TABLE order_items ADD COLUMN deleted_at TEXT`,
    ],
  },
  {
    id: '002_subscriptions_table',
    sql: [
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id                     TEXT PRIMARY KEY,
        company_id             TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        plan                   TEXT NOT NULL DEFAULT 'trial',
        status                 TEXT NOT NULL DEFAULT 'active',
        trial_ends_at          TEXT,
        current_period_start   TEXT,
        current_period_end     TEXT,
        stripe_customer_id     TEXT,
        stripe_subscription_id TEXT,
        cancelled_at           TEXT,
        upgrade_requested_at   TEXT,
        upgrade_target_plan    TEXT,
        created_at             TEXT NOT NULL,
        updated_at             TEXT NOT NULL
      )`,
    ],
  },
  {
    id: '003_plan_configs_table',
    sql: [
      `CREATE TABLE IF NOT EXISTS plan_configs (
        id             TEXT PRIMARY KEY,
        plan_key       TEXT NOT NULL UNIQUE,
        display_name   TEXT NOT NULL,
        description    TEXT NOT NULL,
        price_monthly  REAL NOT NULL DEFAULT 0,
        price_annual   REAL NOT NULL DEFAULT 0,
        max_workers    INTEGER,
        max_storage_gb INTEGER,
        features       TEXT NOT NULL DEFAULT '[]',
        is_public      INTEGER NOT NULL DEFAULT 1,
        sort_order     INTEGER NOT NULL DEFAULT 0,
        created_at     TEXT NOT NULL,
        updated_at     TEXT NOT NULL
      )`,
    ],
  },
  {
    id: '004_feature_flags_table',
    sql: [
      `CREATE TABLE IF NOT EXISTS feature_flags (
        id              TEXT PRIMARY KEY,
        scope           TEXT NOT NULL DEFAULT 'company',
        company_id      TEXT,
        feature_key     TEXT NOT NULL,
        enabled         INTEGER NOT NULL DEFAULT 0,
        override_reason TEXT,
        set_by          TEXT,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_scope_company_key
         ON feature_flags(scope, COALESCE(company_id, ''), feature_key)`,
    ],
  },
  {
    id: '005_integrations_table',
    sql: [
      `CREATE TABLE IF NOT EXISTS integrations (
        id             TEXT PRIMARY KEY,
        company_id     TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        provider       TEXT NOT NULL,
        display_name   TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'pending',
        config         TEXT NOT NULL DEFAULT '',
        last_synced_at TEXT,
        sync_error     TEXT,
        created_at     TEXT NOT NULL,
        updated_at     TEXT NOT NULL
      )`,
    ],
  },
  {
    id: '006_audit_log_table',
    sql: [
      `CREATE TABLE IF NOT EXISTS audit_log (
        id          TEXT PRIMARY KEY,
        company_id  TEXT NOT NULL,
        actor_id    TEXT NOT NULL,
        actor_name  TEXT NOT NULL,
        actor_role  TEXT NOT NULL,
        action      TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id   TEXT NOT NULL,
        meta        TEXT,
        ip_address  TEXT,
        request_id  TEXT,
        created_at  TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_audit_log_company_created
         ON audit_log(company_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_log_company_actor
         ON audit_log(company_id, actor_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_log_entity
         ON audit_log(company_id, entity_type, entity_id)`,
    ],
  },
  {
    id: '007_settings_table',
    sql: [
      `CREATE TABLE IF NOT EXISTS settings (
        id         TEXT PRIMARY KEY,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        key        TEXT NOT NULL,
        value      TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_company_key
         ON settings(company_id, key)`,
    ],
  },
  {
    id: '008_trusted_devices_table',
    sql: [
      `CREATE TABLE IF NOT EXISTS trusted_devices (
        id                 TEXT PRIMARY KEY,
        company_id         TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_fingerprint TEXT NOT NULL,
        device_name        TEXT NOT NULL,
        last_seen_at       TEXT NOT NULL,
        expires_at         TEXT NOT NULL,
        created_at         TEXT NOT NULL
      )`,
    ],
  },
  {
    id: '009_performance_indexes',
    sql: [
      `CREATE INDEX IF NOT EXISTS idx_orders_company_status   ON orders(company_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_company_created  ON orders(company_id, createdAt DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_worker           ON orders(workerId)`,
      `CREATE INDEX IF NOT EXISTS idx_items_order_status      ON order_items(order_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_items_order_vendor      ON order_items(order_id, vendor)`,
      `CREATE INDEX IF NOT EXISTS idx_users_company_role      ON users(company_id, role)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON notifications(company_id, for_who, read)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_created   ON notifications(company_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_subscriptions_company   ON subscriptions(company_id)`,
    ],
  },
  {
    id: '010_chat_messages_table',
    sql: [
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id           TEXT PRIMARY KEY,
        company_id   TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        sender_id    TEXT NOT NULL,
        sender_name  TEXT NOT NULL,
        sender_role  TEXT NOT NULL,
        recipient_id TEXT,
        message      TEXT NOT NULL,
        created_at   TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_chat_company_id  ON chat_messages(company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chat_sender_id   ON chat_messages(sender_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chat_created_at  ON chat_messages(company_id, created_at ASC)`,
    ],
  },
];

// ─── Runner ──────────────────────────────────────────────────────────────────

export async function runMigrations(): Promise<void> {
  const client = getClient();

  // Ensure migrations tracking table exists
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  // Get already-applied migrations
  const applied = await client.execute(`SELECT id FROM _migrations`);
  const appliedIds = new Set(applied.rows.map((r) => r[0] as string));

  let count = 0;
  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) {
      console.log(`[migrations] ✓ ${migration.id} (already applied)`);
      continue;
    }

    console.log(`[migrations] ⟳ Applying ${migration.id}...`);

    for (const sql of migration.sql) {
      try {
        await client.execute(sql);
      } catch (err: unknown) {
        // SQLite "duplicate column" errors are safe to ignore for idempotency
        const msg = String(err);
        if (msg.includes('duplicate column') || msg.includes('already exists')) {
          console.log(`[migrations]   ↳ Skipped (already exists): ${sql.slice(0, 60)}...`);
          continue;
        }
        throw err;
      }
    }

    await client.execute({
      sql: `INSERT INTO _migrations (id, applied_at) VALUES (?, ?)`,
      args: [migration.id, new Date().toISOString()],
    });

    console.log(`[migrations] ✓ ${migration.id} applied`);
    count++;
  }

  if (count === 0) {
    console.log('[migrations] All migrations are up to date.');
  } else {
    console.log(`[migrations] Applied ${count} migration(s).`);
  }

  client.close();
}
