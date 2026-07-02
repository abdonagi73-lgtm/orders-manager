import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { companies, users } from '@/db/schema';
import { eq, ne } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

// Enforce role check utility
function checkSuperAdmin(request: Request) {
  const role = request.headers.get('x-user-role');
  return role === 'super_admin';
}

// GET: Retrieve all companies (except internal administration)
export async function GET(request: Request) {
  if (!checkSuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized system access' }, { status: 403 });
  }

  try {
    const list = await db
      .select()
      .from(companies)
      .where(ne(companies.id, 'system-admin-tenant'));
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve divisions' }, { status: 500 });
  }
}

// POST: Provision a new company and its default administrator account
export async function POST(request: Request) {
  if (!checkSuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized system access' }, { status: 403 });
  }

  try {
    const { name, logoUrl, currency, commissionRate, adminName, adminPin } = await request.json();

    if (!name || !adminName || !adminPin) {
      return NextResponse.json({ error: 'Missing configuration parameters' }, { status: 400 });
    }

    const companyId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const pinHash = bcrypt.hashSync(adminPin, 10);

    // Insert new company
    await db.insert(companies).values({
      id: companyId,
      name,
      logo_url: logoUrl,
      currency: currency || 'QAR',
      commission_rate: commissionRate || 0.03,
      status: 'active',
    });

    // Create default company administrator user
    await db.insert(users).values({
      id: `${companyId}-admin`,
      company_id: companyId,
      name: adminName,
      pin_hash: pinHash,
      role: 'admin',
    });

    // Retrieve and return the created company
    const newCompany = await db.select().from(companies).where(eq(companies.id, companyId));
    return NextResponse.json(newCompany[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to provision division' }, { status: 500 });
  }
}

// PUT: Modify company details (e.g. suspend or activate status)
export async function PUT(request: Request) {
  if (!checkSuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized system access' }, { status: 403 });
  }

  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Division ID and status are required' }, { status: 400 });
    }

    await db
      .update(companies)
      .set({ status })
      .where(eq(companies.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to modify division status' }, { status: 500 });
  }
}

// PATCH: Same as PUT — update company status (alias for Founder Console)
export { PUT as PATCH };
