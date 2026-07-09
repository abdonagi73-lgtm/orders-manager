import assert from 'assert';
import { db } from '../../db/db';
import { companies, users, orders } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

async function runTests() {
  console.log('🧪 Starting Tenant Isolation Tests...');

  const testCompany1 = {
    id: 'iso-test-company-1',
    name: 'Test Company 1',
    currency: 'USD',
    commission_rate: 0.05,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const testCompany2 = {
    id: 'iso-test-company-2',
    name: 'Test Company 2',
    currency: 'EUR',
    commission_rate: 0.10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const testUser1 = {
    id: 'iso-test-user-1',
    company_id: 'iso-test-company-1',
    name: 'User One',
    email: 'user1@iso-test.com',
    pin_hash: 'dummy-hash-1',
    role: 'worker',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const testUser2 = {
    id: 'iso-test-user-2',
    company_id: 'iso-test-company-2',
    name: 'User Two',
    email: 'user2@iso-test.com',
    pin_hash: 'dummy-hash-2',
    role: 'worker',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const testOrder1 = {
    id: 'iso-test-order-1',
    company_id: 'iso-test-company-1',
    name: 'Order for Company 1',
    startDate: new Date().toISOString(),
    workerId: 'iso-test-user-1',
    workerName: 'User One',
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  const testOrder2 = {
    id: 'iso-test-order-2',
    company_id: 'iso-test-company-2',
    name: 'Order for Company 2',
    startDate: new Date().toISOString(),
    workerId: 'iso-test-user-2',
    workerName: 'User Two',
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  try {
    // 1. Clean up potential residue from failed runs
    await cleanUp();

    // 2. Insert test tenants and data
    console.log('  Inserting test seed data...');
    await db.insert(companies).values([testCompany1, testCompany2]);
    await db.insert(users).values([testUser1, testUser2]);
    await db.insert(orders).values([testOrder1, testOrder2]);

    // 3. Test isolation on orders
    console.log('  Verifying Company 1 query boundary...');
    const result1 = await db
      .select()
      .from(orders)
      .where(eq(orders.company_id, 'iso-test-company-1'));
    
    assert.strictEqual(result1.length, 1, 'Company 1 should only retrieve 1 order.');
    assert.strictEqual(result1[0].id, 'iso-test-order-1', 'Company 1 should retrieve its own order.');
    assert.strictEqual(result1[0].company_id, 'iso-test-company-1', 'Company 1 should verify matches its ID.');

    console.log('  Verifying Company 2 query boundary...');
    const result2 = await db
      .select()
      .from(orders)
      .where(eq(orders.company_id, 'iso-test-company-2'));

    assert.strictEqual(result2.length, 1, 'Company 2 should only retrieve 1 order.');
    assert.strictEqual(result2[0].id, 'iso-test-order-2', 'Company 2 should retrieve its own order.');
    assert.strictEqual(result2[0].company_id, 'iso-test-company-2', 'Company 2 should verify matches its ID.');

    // 4. Test cross-tenant access attempt
    console.log('  Testing illegal cross-tenant lookup protection...');
    const illegalLookup = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.company_id, 'iso-test-company-1'),
          eq(orders.id, 'iso-test-order-2') // Order belonging to company 2
        )
      );
    
    assert.strictEqual(illegalLookup.length, 0, 'Cross-tenant lookup must return zero records.');

    console.log('✅ Tenant Isolation Tests Passed successfully!');
  } catch (error) {
    console.error('❌ Tenant Isolation Tests Failed:', error);
    process.exit(1);
  } finally {
    console.log('  Cleaning up test seed data...');
    await cleanUp();
  }
}

async function cleanUp() {
  await db.delete(orders).where(eq(orders.id, 'iso-test-order-1'));
  await db.delete(orders).where(eq(orders.id, 'iso-test-order-2'));
  await db.delete(users).where(eq(users.id, 'iso-test-user-1'));
  await db.delete(users).where(eq(users.id, 'iso-test-user-2'));
  await db.delete(companies).where(eq(companies.id, 'iso-test-company-1'));
  await db.delete(companies).where(eq(companies.id, 'iso-test-company-2'));
}

runTests();
