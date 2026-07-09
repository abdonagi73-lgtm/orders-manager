import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { Platform } from '../config/platform';

async function main() {
  console.log('Running database migrations...');
  const url = Platform.db.url || 'file:local.db';
  const client = createClient({ url });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations applied successfully!');
  client.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
