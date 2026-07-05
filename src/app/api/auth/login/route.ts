import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, companies } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { encryptSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

// Build session token + response helper
async function buildSessionResponse(user: typeof users.$inferSelect, company: typeof companies.$inferSelect) {
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

// NOTE: The GET endpoint that listed all users by companyId has been removed.
// It exposed user names and roles to unauthenticated callers. Use /api/owner/team (authenticated) instead.

// POST: Authenticate any user — routes based on role, detects first-time owners
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loginInput = body.loginInput || body.userId;
    const password = body.password || body.pin;
    const selectedUserId = body.selectedUserId;

    if (!loginInput || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
    }

    // ── Path A: A specific userId was already chosen from workspace list ──
    if (selectedUserId) {
      const results = await db
        .select({ user: users, company: companies })
        .from(users)
        .innerJoin(companies, eq(users.company_id, companies.id))
        .where(eq(users.id, selectedUserId));

      if (results.length === 0) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

      const { user, company } = results[0];

      if (company.status !== 'active') {
        return NextResponse.json({ error: 'Subscription suspended. Contact support.' }, { status: 403 });
      }

      const match = bcrypt.compareSync(password, user.pin_hash);
      if (!match) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });

      // First-time owner: must set permanent password
      if (!user.is_activated && (user.role === 'admin' || user.role === 'owner')) {
        return NextResponse.json({
          requiresActivation: true,
          userId: user.id,
          companyId: company.id,
          companyName: company.name,
        });
      }

      return buildSessionResponse(user, company);
    }

    // ── Path B: Look up by email, user ID, or name ──
    const results = await db
      .select({ user: users, company: companies })
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
      // Use identical error to password mismatch — prevents user enumeration
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Filter by matching password
    const validMatches = results.filter((item) =>
      bcrypt.compareSync(password, item.user.pin_hash)
    );

    if (validMatches.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Exactly one match
    if (validMatches.length === 1) {
      const { user, company } = validMatches[0];

      if (company.status !== 'active') {
        return NextResponse.json({ error: 'Subscription suspended. Contact support.' }, { status: 403 });
      }

      // First-time owner: must set permanent password before entering portal
      if (!user.is_activated && (user.role === 'admin' || user.role === 'owner')) {
        return NextResponse.json({
          requiresActivation: true,
          userId: user.id,
          companyId: company.id,
          companyName: company.name,
        });
      }

      return buildSessionResponse(user, company);
    }

    // Multiple workspaces for the same credential
    const workspaces = validMatches.map((item) => ({
      companyId: item.company.id,
      companyName: item.company.name,
      userId: item.user.id,
      role: item.user.role,
    }));

    return NextResponse.json({ selectWorkspace: true, workspaces });

  } catch {
    return NextResponse.json({ error: 'Internal login error' }, { status: 500 });
  }
}
