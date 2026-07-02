import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { companies, users } from '@/db/schema';
import { encryptSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { companyName, logoUrl, currency, commissionRate, adminName, adminPin } = await req.json();

    if (!companyName || !adminName || !adminPin) {
      return NextResponse.json({ error: 'Company Name, Admin Name, and PIN are required' }, { status: 400 });
    }

    if (adminPin.length !== 4 || isNaN(Number(adminPin))) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    // 1. Create company ID and row
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

    // 2. Create default Admin user
    const adminId = 'u_' + Date.now();
    const pinHash = bcrypt.hashSync(adminPin, 10);
    const newAdmin = {
      id: adminId,
      company_id: companyId,
      name: adminName.trim(),
      pin_hash: pinHash,
      role: 'admin',
    };

    await db.insert(users).values(newAdmin);

    // 3. Create active session token
    const token = await encryptSession({
      id: adminId,
      name: newAdmin.name,
      role: newAdmin.role,
      companyId: newCompany.id,
      companyName: newCompany.name,
      currency: newCompany.currency,
      commissionRate: newCompany.commission_rate,
    });

    const response = NextResponse.json({ success: true });

    // 4. Set Session Cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    console.log(`[SIGNUP] Registered new company: ${newCompany.name} (Admin: ${newAdmin.name})`);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
