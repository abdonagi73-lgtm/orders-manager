import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { companies, users, vendors, accessRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encryptSession } from '@/lib/auth';
import { Platform } from '@/config/platform';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const {
      companyName,
      logoUrl,
      currency,
      commissionRate,
      adminName,
      adminPin,
      adminEmail, // Added email parameter
      // Optional: from onboarding wizard
      workers = [],
      vendors: vendorList = [],
      onboardingToken,
    } = await req.json();

    if (!companyName || !adminName || !adminPin) {
      return NextResponse.json({ error: 'Company Name, Admin Name, and Password are required' }, { status: 400 });
    }

    if (String(adminPin).length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    // 1. Create company
    const companyId = 'c_' + Date.now();
    const newCompany = {
      id: companyId,
      name: companyName.trim(),
      logo_url: logoUrl ? logoUrl.trim() : null,
      currency: currency || 'USD',
      commission_rate: Number(commissionRate) || 0.03,
      status: 'active',
    };
    await db.insert(companies).values(newCompany);

    // 2. Create admin user
    const adminId = 'u_admin_' + Date.now();
    const pinHash = bcrypt.hashSync(String(adminPin), 10);
    await db.insert(users).values({
      id: adminId,
      company_id: companyId,
      name: adminName.trim(),
      email: adminEmail ? String(adminEmail).trim().toLowerCase() : null,
      pin_hash: pinHash,
      role: 'admin',
    });

    // 3. Create additional workers from wizard
    for (const worker of workers) {
      if (!worker.name || !worker.pin) continue;
      const workerId = `${companyId}-${worker.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomUUID().slice(0, 6)}`;
      const workerHash = bcrypt.hashSync(String(worker.pin), 10);
      await db.insert(users).values({
        id: workerId,
        company_id: companyId,
        name: worker.name.trim(),
        pin_hash: workerHash,
        role: worker.role || 'worker',
      });
    }

    // 4. Create vendors from wizard
    for (const vendor of vendorList) {
      if (!vendor.name) continue;
      const vendorId = `${companyId}-v-${vendor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomUUID().slice(0, 6)}`;
      await db.insert(vendors).values({
        id: vendorId,
        company_id: companyId,
        name: vendor.name.trim(),
        frequency_score: 0,
      });
    }

    // 5. Mark onboarding token as used (if provided from invite flow)
    if (onboardingToken) {
      await db
        .update(accessRequests)
        .set({ status: 'approved', onboarding_token: '', updated_at: new Date().toISOString() })
        .where(eq(accessRequests.onboarding_token, onboardingToken));
    }

    // 6. Create session cookie
    const token = await encryptSession({
      id: adminId,
      name: adminName.trim(),
      role: 'admin',
      companyId: newCompany.id,
      companyName: newCompany.name,
      currency: newCompany.currency,
      commissionRate: newCompany.commission_rate,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: Platform.app.isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log(`[SIGNUP] ${newCompany.name} — ${workers.length} workers, ${vendorList.length} vendors created`);
    return response;
  } catch (error: any) {
    console.error('[signup]', error);
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
