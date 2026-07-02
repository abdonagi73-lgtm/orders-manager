import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, companies, vendors } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { encryptSession, decryptSession } from '@/lib/auth';

async function findUserByPin(pin: string) {
  const allUsers = await db
    .select({
      user: users,
      company: companies,
    })
    .from(users)
    .innerJoin(companies, eq(users.company_id, companies.id));

  for (const row of allUsers) {
    if (bcrypt.compareSync(pin, row.user.pin_hash)) {
      return row;
    }
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
    let company = { id: '', name: 'Flowriq', logo_url: null as string | null, currency: 'USD', commission_rate: 0.03 };
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

    // Settings config
    const settings = {
      tax: 6,
      markup: 3.5,
      shipping: 6.10,
      ownerPin: '9999',
    };

    return NextResponse.json({ settings, registry, workers, managers, company: { name: company.name, logoUrl: company.logo_url } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'verify-worker') {
      const result = await findUserByPin(body.pin);
      if (result && (result.user.role === 'worker' || result.user.role === 'admin')) {
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

        console.log(`[AUTH] Worker login verified: ${user.name} (${company.name})`);
        return response;
      }
      return NextResponse.json({ ok: false, error: 'Incorrect PIN' });
    }

    if (body.action === 'verify-owner') {
      const result = await findUserByPin(body.pin);
      if (result && (result.user.role === 'admin' || result.user.role === 'super_admin')) {
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

        const response = NextResponse.json({ ok: true });

        response.cookies.set('session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        });

        console.log(`[AUTH] Owner/Manager login verified: ${user.name} (${company.name})`);
        return response;
      }
      return NextResponse.json({ ok: false, error: 'Incorrect PIN' });
    }

    if (body.action === 'change-worker-pin') {
      const { workerId, newPin } = body;
      if (!workerId || !newPin || newPin.length < 4) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
      }
      const pinHash = bcrypt.hashSync(newPin, 10);
      await db.update(users).set({ pin_hash: pinHash }).where(eq(users.id, workerId));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
