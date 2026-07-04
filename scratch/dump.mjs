import { createClient } from '@libsql/client';
const client = createClient({ url: 'file:local.db' });
const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
for (const row of tables.rows) {
  const t = row.name;
  if (t.startsWith('_')) continue;
  const data = await client.execute(`SELECT * FROM ${t}`);
  console.log(`=== TABLE: ${t} ===`);
  console.log(data.rows);
}
