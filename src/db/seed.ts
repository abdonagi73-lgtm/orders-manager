import { db, client } from './db';
import { companies, users } from './schema';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  // Reset database
  await db.delete(users);
  await db.delete(companies);

  // Hash PIN helper
  const hashPin = (pin: string) => bcrypt.hashSync(pin, 10);

  // 1. System Administration Tenant
  const systemAdminTenant = {
    id: 'system-admin-tenant',
    name: 'System Administration',
    logo_url: '/logo-flowxiq-navy.png',
    currency: 'USD',
    commission_rate: 0,
    status: 'active',
  };

  await db.insert(companies).values(systemAdminTenant);

  // Super Admin User (PIN 9999)
  await db.insert(users).values({
    id: 'super-admin-user',
    company_id: systemAdminTenant.id,
    name: 'Super Admin',
    pin_hash: hashPin('9999'),
    role: 'super_admin',
  });

  console.log('Database seeding completed successfully!');
  client.close();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  client.close();
  process.exit(1);
});
