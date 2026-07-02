import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, companies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

// GET: Retrieve users by companyId for dropdown select
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
  }

  try {
    const list = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.company_id, companyId));

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve user profiles' }, { status: 500 });
  }
}

// POST: Authenticate user via PIN code and create session
export async function POST(request: Request) {
  try {
    const { userId, pin } = await request.json();

    if (!userId || !pin) {
      return NextResponse.json({ error: 'User ID and PIN are required' }, { status: 400 });
    }

    // Load user along with company config
    const results = await db
      .select({
        user: users,
        company: companies,
      })
      .from(users)
      .innerJoin(companies, eq(users.company_id, companies.id))
      .where(eq(users.id, userId));

    if (results.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { user, company } = results[0];

    // Check company status
    if (company.status !== 'active') {
      return NextResponse.json({ error: 'Subscription suspended. Contact support.' }, { status: 403 });
    }

    // Verify PIN passcode
    const match = bcrypt.compareSync(pin, user.pin_hash);
    if (!match) {
      return NextResponse.json({ error: 'Incorrect security PIN' }, { status: 401 });
    }

    // Encrypt session context
    const token = await encryptSession({
      id: user.id,
      name: user.name,
      role: user.role,
      companyId: company.id,
      companyName: company.name,
      currency: company.currency,
      commissionRate: company.commission_rate,
    });

    const response = NextResponse.json({
      success: true,
      role: user.role,
    });

    // Set cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal login error' }, { status: 500 });
  }
}
