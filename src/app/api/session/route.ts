import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, companies, vendors } from '@/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { encryptSession, decryptSession } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/api/rateLimit';

async function findUserByPin(pin: string, companyId?: string) {
  // Scope to a specific company when possible — avoids scanning the entire users table
  const conditions = companyId
    ? and(eq(users.company_id, companyId), isNull(users.deleted_at))
    : isNull(users.deleted_at);

  const candidates = await db
    .select({ user: users, company: companies })
    .from(users)
    .innerJoin(companies, eq(users.company_id, companies.id))
    .where(conditions);

  for (const row of candidates) {
    const match = await bcrypt.compare(pin, row.user.pin_hash);
    if (match) return row;
  }
  return null;
}


export async function GET(req: NextRequest) {
  try {
    let companyId = req.headers.get('x-company-id');
    if (!companyId) {
      const token = req.cookies.get('session')?.value;
      if (token) {
        const session = await decryptSession(token);
        if (session) {
          companyId = session.companyId;
        }
      }
    }

    // Determine company context
    let company = { id: '', name: 'Flowxiq', logo_url: null as string | null, currency: 'USD', commission_rate: 0.03 };
    if (companyId) {
      const companyList = await db.select().from(companies).where(eq(companies.id, companyId));
      if (companyList[0]) {
        company = {
          id: companyList[0].id,
          name: companyList[0].name,
          logo_url: companyList[0].logo_url,
          currency: companyList[0].currency,
          commission_rate: companyList[0].commission_rate,
        };
      }
    } else {
      // Pre-login fallback: get the first active registered tenant in the system (excluding admin tenant)
      const companyList = await db.select().from(companies).where(eq(companies.status, 'active')).orderBy(desc(companies.id));
      const activeClient = companyList.find(c => c.id !== 'system-admin-tenant');
      if (activeClient) {
        company = {
          id: activeClient.id,
          name: activeClient.name,
          logo_url: activeClient.logo_url,
          currency: activeClient.currency,
          commission_rate: activeClient.commission_rate,
        };
        companyId = activeClient.id;
      }
    }

    // 2. Get workers and managers
    let workers: any[] = [];
    let managers: any[] = [];
    if (companyId) {
      const allUsers = await db.select().from(users).where(eq(users.company_id, companyId));
      workers = allUsers
        .filter((u) => u.role === 'worker')
        .map((u) => ({ id: u.id, name: u.name, pin: '****' }));
      managers = allUsers
        .filter((u) => u.role === 'admin')
        .map((u) => ({ id: u.id, name: u.name, pin: '****' }));
    }

    // 3. Get registry from vendors
    let registry: Record<string, number> = {};
    if (companyId) {
      const dbVendors = await db.select().from(vendors).where(eq(vendors.company_id, companyId));
      registry = dbVendors.reduce((acc, v) => {
        acc[v.name] = v.frequency_score;
        return acc;
      }, {} as Record<string, number>);
    }

    // Settings config — these are defaults; per-company overrides come from the settings table
    const settings = {
      tax: 6,
      markup: 3.5,
      shipping: 6.10,
    };

    // 4. Build user context from session cookie
    let userContext: { id: string; name: string; role: string } | null = null;
    const sessionToken = req.cookies.get('session')?.value;
    if (sessionToken) {
      const session = await decryptSession(sessionToken);
      if (session) {
        userContext = { id: session.id, name: session.name, role: session.role };
      }
    }

    return NextResponse.json({ settings, registry, workers, managers, company: { name: company.name, logoUrl: company.logo_url }, user: userContext });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'verify-worker') {
      // Rate limit: 10 password attempts per 5 minutes per IP
      const ip = getClientIp(req);
      const limit = await rateLimit(`pw-worker:${ip}`, 10, 5 * 60 * 1000);
      if (!limit.allowed) {
        return NextResponse.json({ ok: false, error: 'Too many attempts. Please wait and try again.' }, { status: 429 });
      }

      const password = body.password ?? body.pin; // backwards-compatible
      const result = await findUserByPin(password, body.companyId);
      if (result && (result.user.role === 'worker' || result.user.role === 'admin' || result.user.role === 'manager')) {
        const { user, company } = result;
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
          ok: true,
          worker: { 
            id: user.id, 
            name: user.name,
            companyName: company.name,
            logoUrl: company.logo_url,
          },
        });

        response.cookies.set('session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        });

        return response;
      }
      return NextResponse.json({ ok: false, error: 'Incorrect password' });
    }

    if (body.action === 'verify-owner') {
      // Rate limit: 10 password attempts per 5 minutes per IP
      const ip = getClientIp(req);
      const limit = await rateLimit(`pw-owner:${ip}`, 10, 5 * 60 * 1000);
      if (!limit.allowed) {
        return NextResponse.json({ ok: false, error: 'Too many attempts. Please wait and try again.' }, { status: 429 });
      }

      const password = body.password ?? body.pin; // backwards-compatible
      const result = await findUserByPin(password, body.companyId);
      if (result && (result.user.role === 'admin' || result.user.role === 'owner' || result.user.role === 'manager' || result.user.role === 'super_admin')) {
        const { user, company } = result;
        const token = await encryptSession({
          id: user.id,
          name: user.name,
          role: user.role,
          companyId: company.id,
          companyName: company.name,
          currency: company.currency,
          commissionRate: company.commission_rate,
        });

        const response = NextResponse.json({ ok: true, companyId: company.id });

        response.cookies.set('session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        });

        return response;
      }
      return NextResponse.json({ ok: false, error: 'Incorrect password' });
    }

    if (body.action === 'change-worker-pin' || body.action === 'change-worker-password') {
      // Require a valid session and verify same company
      const sessionToken = req.cookies.get('session')?.value;
      const session = sessionToken ? await decryptSession(sessionToken) : null;
      if (!session?.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { workerId, newPin } = body;
      const newPassword = body.newPassword ?? newPin;
      if (!workerId || !newPassword || String(newPassword).length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      // Verify target worker belongs to the same company as the caller
      const target = await db
        .select({ id: users.id, company_id: users.company_id })
        .from(users)
        .where(and(eq(users.id, workerId), eq(users.company_id, session.companyId)))
        .limit(1);

      if (target.length === 0) {
        return NextResponse.json({ error: 'Worker not found or access denied' }, { status: 403 });
      }

      const pinHash = bcrypt.hashSync(String(newPassword), 10);
      await db.update(users).set({ pin_hash: pinHash }).where(eq(users.id, workerId));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[session]', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
