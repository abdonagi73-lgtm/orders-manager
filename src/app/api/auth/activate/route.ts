import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encryptSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

// POST: First-time owner sets their permanent password and activates their account
export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Find the user
    const result = await db
      .select({ user: users, company: companies })
      .from(users)
      .innerJoin(companies, eq(users.company_id, companies.id))
      .where(eq(users.id, userId));

    if (result.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { user, company } = result[0];

    // Only owner/admin roles can use this activation endpoint
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Activation not available for this account type' }, { status: 403 });
    }

    // Hash the new password and mark account as activated
    const newHash = bcrypt.hashSync(newPassword, 10);
    await db
      .update(users)
      .set({ pin_hash: newHash, is_activated: true })
      .where(eq(users.id, userId));

    // Create a fresh session immediately — owner can start using the portal
    const token = await encryptSession({
      id: user.id,
      name: user.name,
      role: user.role,
      companyId: company.id,
      companyName: company.name,
      currency: company.currency,
      commissionRate: company.commission_rate,
    });

    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7-day session for owners
      path: '/',
    });
    return response;

  } catch {
    return NextResponse.json({ error: 'Activation failed. Please try again.' }, { status: 500 });
  }
}
