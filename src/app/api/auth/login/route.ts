import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, companies } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
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

// POST: Authenticate user globally by Email or User ID and create session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loginInput = body.loginInput || body.userId;
    const password = body.password || body.pin;
    const selectedUserId = body.selectedUserId;

    if (!loginInput || !password) {
      return NextResponse.json({ error: 'Email/Username and Password are required' }, { status: 400 });
    }

    // 1. If a specific userId was selected (from a multi-tenant choice list)
    if (selectedUserId) {
      const results = await db
        .select({
          user: users,
          company: companies,
        })
        .from(users)
        .innerJoin(companies, eq(users.company_id, companies.id))
        .where(eq(users.id, selectedUserId));

      if (results.length === 0) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      const { user, company } = results[0];

      if (company.status !== 'active') {
        return NextResponse.json({ error: 'Subscription suspended. Contact support.' }, { status: 403 });
      }

      const match = bcrypt.compareSync(password, user.pin_hash);
      if (!match) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }

      // Create session
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
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      return response;
    }

    // 2. Default: Look up matching profiles by email, name, or ID
    const results = await db
      .select({
        user: users,
        company: companies,
      })
      .from(users)
      .innerJoin(companies, eq(users.company_id, companies.id))
      .where(
        or(
          eq(users.email, loginInput.trim().toLowerCase()),
          eq(users.id, loginInput.trim()),
          eq(users.name, loginInput.trim())
        )
      );

    if (results.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. Filter valid password matches
    const validMatches = results.filter((item) =>
      bcrypt.compareSync(password, item.user.pin_hash)
    );

    if (validMatches.length === 0) {
      return NextResponse.json({ error: 'Incorrect security credentials' }, { status: 401 });
    }

    // 4. If exactly one matching workspace
    if (validMatches.length === 1) {
      const { user, company } = validMatches[0];

      if (company.status !== 'active') {
        return NextResponse.json({ error: 'Subscription suspended. Contact support.' }, { status: 403 });
      }

      // Create session
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
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      return response;
    }

    // 5. Multi-tenant: Return list of matching workspaces
    const workspaces = validMatches.map((item) => ({
      companyId: item.company.id,
      companyName: item.company.name,
      userId: item.user.id,
      role: item.user.role,
    }));

    return NextResponse.json({
      selectWorkspace: true,
      workspaces,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal login error' }, { status: 500 });
  }
}
