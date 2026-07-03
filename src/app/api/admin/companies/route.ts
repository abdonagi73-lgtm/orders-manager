import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { companies, users } from '@/db/schema';
import { eq, ne } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';

// Auth: accept super_admin from session cookie OR x-user-role header (for backward compat)
async function isSuperAdmin(request: NextRequest): Promise<boolean> {
  // 1. Check session cookie first (browser clients)
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (sessionCookie?.value) {
      const session = await decryptSession(sessionCookie.value);
      if (session?.role === 'super_admin') return true;
    }
  } catch {}

  // 2. Fallback to x-user-role header (server-to-server)
  return request.headers.get('x-user-role') === 'super_admin';
}

// GET: Retrieve all companies (except internal administration)
export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin(request))) {
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

// POST: Create a new customer workspace and administrative owner account
export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized system access' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      logoUrl,
      industry,
      businessType,
      country,
      stateProvince,
      city,
      timezone,
      currency,
      language,
      website,
      phone,
      email,
      taxId,
      plan,
      billingCycle,
      maxUsers,
      maxWorkers,
      storageLimitGb,
      trialExpiration,
      ownerName,
      ownerEmail,
      ownerPhone,
    } = body;

    if (!name || !ownerName || !ownerEmail) {
      return NextResponse.json({ error: 'Company Name, Owner Name, and Owner Email are required' }, { status: 400 });
    }

    const companyId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Generate secure activation passcode (owner uses this + email on first login)
    const tempPasscode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const passcodeHash = bcrypt.hashSync(tempPasscode, 10);

    // Check if company ID already exists
    const existing = await db.select().from(companies).where(eq(companies.id, companyId));
    if (existing.length > 0) {
      return NextResponse.json({ error: `A workspace with the ID "${companyId}" already exists. Use a different company name.` }, { status: 409 });
    }

    // Insert new company configuration
    await db.insert(companies).values({
      id: companyId,
      name: name.trim(),
      logo_url: logoUrl || null,
      currency: currency || 'USD',
      commission_rate: 0.03,
      status: 'active',
      industry: industry || null,
      business_type: businessType || null,
      country: country || null,
      state_province: stateProvince || null,
      city: city || null,
      timezone: timezone || null,
      language: language || null,
      website: website || null,
      phone: phone || null,
      email: email || null,
      tax_id: taxId || null,
      plan: plan || 'growth',
      billing_cycle: billingCycle || 'monthly',
      max_users: Number(maxUsers) || 10,
      max_workers: Number(maxWorkers) || 50,
      storage_limit_gb: Number(storageLimitGb) || 10,
      trial_expiration: trialExpiration || null,
      owner_name: ownerName || null,
      owner_phone: ownerPhone || null,
    });

    // Check if owner user already exists
    const existingUser = await db.select().from(users).where(eq(users.id, `${companyId}-admin`));
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: `${companyId}-admin`,
        company_id: companyId,
        name: ownerName.trim(),
        email: ownerEmail.trim().toLowerCase(),
        pin_hash: passcodeHash,
        role: 'admin',
        is_activated: false,
      });
    }

    // Return created company + activation passcode
    const newCompany = await db.select().from(companies).where(eq(companies.id, companyId));
    return NextResponse.json({
      ...newCompany[0],
      activationPasscode: tempPasscode,
    });
  } catch (error: any) {
    console.error('Create workspace error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create customer workspace' }, { status: 500 });
  }
}

// PUT: Modify company status (suspend / activate)
export async function PUT(request: NextRequest) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized system access' }, { status: 403 });
  }

  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Division ID and status are required' }, { status: 400 });
    }

    await db.update(companies).set({ status }).where(eq(companies.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to modify division status' }, { status: 500 });
  }
}

export { PUT as PATCH };
