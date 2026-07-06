import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decryptSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await decryptSession(token);
    if (!session?.companyId) return NextResponse.json({ error: 'No company context' }, { status: 401 });

    const { name, logoUrl } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    await db
      .update(companies)
      .set({ name: name.trim(), logo_url: logoUrl?.trim() || null })
      .where(eq(companies.id, session.companyId));

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update company info.' }, { status: 500 });
  }
}
