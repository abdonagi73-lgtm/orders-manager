import { NextResponse } from 'next/server';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const token = request.headers.get('cookie')
    ?.split('; ')
    .find((row) => row.startsWith('session='))
    ?.split('=')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await decryptSession(token);
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Refetch company details dynamically to ensure up-to-date logoUrl is returned
  const companyResults = await db
    .select({ logoUrl: companies.logo_url })
    .from(companies)
    .where(eq(companies.id, session.companyId));

  const logoUrl = companyResults.length > 0 ? companyResults[0].logoUrl : null;

  return NextResponse.json({
    id: session.id,
    name: session.name,
    role: session.role,
    companyId: session.companyId,
    companyName: session.companyName,
    logoUrl,
    currency: session.currency,
    commissionRate: session.commissionRate,
  });
}
