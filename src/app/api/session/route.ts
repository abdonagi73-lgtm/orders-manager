import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, companies, vendors } from '@/db/schema';
import { eq, and, desc, isNull, inArray } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { encryptSession, decryptSession } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/api/rateLimit';
import { isSubscriptionActive } from '@/lib/subscription/gate';
import { Platform } from '@/config/platform';

/**
 * Find a user by password hash within an optional company/role scope.
 * roleFilter narrows the candidate set so we only bcrypt-check relevant users.
 */
async function findUserByPin(
  pin: string,
  companyId?: string,
  roleFilter?: string[]
) {
  const conditions: ReturnType<typeof eq>[] = [isNull(users.deleted_at) as any];
  if (companyId) conditions.push(eq(users.company_id, companyId) as any);
  if (roleFilter?.length) conditions.push(inArray(users.role, roleFilter) as any);

  const candidates = await db
    .select({ user: users, company: companies })
    .from(users)
    .innerJoin(companies, eq(users.company_id, companies.id))
    .where(and(...conditions));

  for (const row of candidates) {
    if (!row.user.pin_hash) continue;
    const match = await bcrypt.compare(pin, row.user.pin_hash);
    if (match) return row;
  }
  return null;
}


export async function GET(req: NextRequest) {
  try {
    const urlCompanyId = req.nextUrl.searchParams.get('companyId');
    let companyId = urlCompanyId || req.headers.get('x-company-id');
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
    let company = {
      id: '',
      name: 'Flowxiq',
      logo_url: null as string | null,
      currency: 'USD',
      commission_rate: 0.03,
      pos_type: null as string | null,
      form_fields: null as any
    };
    if (companyId) {
      const companyList = await db.select().from(companies).where(eq(companies.id, companyId));
      if (companyList[0]) {
        company = {
          id: companyList[0].id,
          name: companyList[0].name,
          logo_url: companyList[0].logo_url,
          currency: companyList[0].currency,
          commission_rate: companyList[0].commission_rate,
          pos_type: companyList[0].pos_type,
          form_fields: companyList[0].form_fields ? JSON.parse(companyList[0].form_fields) : null,
        };
      }
    } else {
      // Pre-login fallback: only query the DB if there is exactly one active client company
      const companyList = await db.select().from(companies).where(eq(companies.status, 'active')).orderBy(desc(companies.id));
      const activeClients = companyList.filter(c => c.id !== 'system-admin-tenant');
      if (activeClients.length === 1) {
        const activeClient = activeClients[0];
        company = {
          id: activeClient.id,
          name: activeClient.name,
          logo_url: activeClient.logo_url,
          currency: activeClient.currency,
          commission_rate: activeClient.commission_rate,
          pos_type: activeClient.pos_type,
          form_fields: activeClient.form_fields ? JSON.parse(activeClient.form_fields) : null,
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

    // 4. Build user context from session cookie
    let userContext: { id: string; name: string; role: string } | null = null;
    const sessionToken = req.cookies.get('session')?.value;
    if (sessionToken) {
      const session = await decryptSession(sessionToken);
      if (session) {
        userContext = { id: session.id, name: session.name, role: session.role };
      }
    }

    const active = companyId ? await isSubscriptionActive(db, companyId) : true;

    return NextResponse.json({
      registry,
      workers,
      managers,
      company: {
        name: company.name,
        logoUrl: company.logo_url,
        pos_type: company.pos_type,
        form_fields: company.form_fields
      },
      user: userContext,
      subscriptionActive: active
    });
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

      if (!body.companyId) {
        return NextResponse.json({ ok: false, error: 'Company identifier required.' }, { status: 400 });
      }

      const password = body.password ?? body.pin; // backwards-compatible
      const result = await findUserByPin(password, body.companyId, ['worker', 'admin', 'manager']);
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
            companyId: company.id,
          },
        });

        response.cookies.set('session', token, {
          httpOnly: true,
          secure: Platform.app.isProduction,
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

      if (!body.companyId) {
        return NextResponse.json({ ok: false, error: 'Company identifier required.' }, { status: 400 });
      }

      const password = body.password ?? body.pin; // backwards-compatible
      const result = await findUserByPin(password, body.companyId, ['admin', 'manager', 'owner', 'super_admin']);
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
          secure: Platform.app.isProduction,
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

