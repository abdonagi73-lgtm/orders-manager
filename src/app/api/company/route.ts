import { NextRequest, NextResponse } from 'next/server';
import { decryptSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await decryptSession(token);
    if (!session?.companyId) return NextResponse.json({ error: 'No company context' }, { status: 401 });

    const { name, logoUrl } = await req.json();
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'Business name is required' }, { status: 400 });

    const db = await getDb();

    await db.run(
      `UPDATE companies SET name = ?, logo_url = ? WHERE id = ?`,
      [name.trim(), logoUrl || null, session.companyId]
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
