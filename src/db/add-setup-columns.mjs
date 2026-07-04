// Run with: node --env-file=.env.local src/db/add-setup-columns.mjs
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrations = [
  `ALTER TABLE companies ADD COLUMN setup_complete INTEGER DEFAULT 0`,
  `ALTER TABLE companies ADD COLUMN pos_type TEXT`,
  `ALTER TABLE companies ADD COLUMN form_fields TEXT`,
];

for (const sql of migrations) {
  try {
    await client.execute(sql);
    console.log('✅', sql.split(' ').slice(0, 6).join(' '));
  } catch (e) {
    if (e.message?.includes('duplicate column')) {
      console.log('⏭ already exists:', sql.split(' ')[5]);
    } else {
      console.error('❌', e.message);
    }
  }
}

client.close();
console.log('Done.');
