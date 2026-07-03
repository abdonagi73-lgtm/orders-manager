import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, companies } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  try { return await decryptSession(sessionCookie.value); }
  catch { return null; }
}

// GET /api/owner/dashboard — returns company + orders summary for the owner portal
export async function GET() {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [companyRows, orderRows] = await Promise.all([
      db.select().from(companies).where(eq(companies.id, session.companyId)),
      db.select().from(orders).where(eq(orders.company_id, session.companyId)).orderBy(desc(orders.createdAt)),
    ]);

    return NextResponse.json({
      company: companyRows[0] || null,
      orders: orderRows,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
