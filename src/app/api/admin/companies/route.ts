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

// POST: Create a new customer workspace and administrative owner account
export async function POST(request: Request) {
  if (!checkSuperAdmin(request)) {
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

    // Generate secure activation credentials
    const tempPasscode = Math.random().toString(36).substring(2, 10);
    const pinHash = bcrypt.hashSync(tempPasscode, 10);

    // Insert new company configuration
    await db.insert(companies).values({
      id: companyId,
      name: name.trim(),
      logo_url: logoUrl || null,
      currency: currency || 'USD',
      commission_rate: 0.03, // Default commission
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

    // Create owner account — is_activated=false forces password setup on first login
    await db.insert(users).values({
      id: `${companyId}-admin`,
      company_id: companyId,
      name: ownerName.trim(),
      email: ownerEmail.trim().toLowerCase(),
      pin_hash: pinHash,
      role: 'admin',
      is_activated: false,
    });

    // Retrieve and return the created company
    const newCompany = await db.select().from(companies).where(eq(companies.id, companyId));
    return NextResponse.json({
      ...newCompany[0],
      activationPasscode: tempPasscode, // Expose passcode back to wizard for activation review step
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer workspace' }, { status: 500 });
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
