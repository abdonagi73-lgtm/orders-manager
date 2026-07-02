import { NextResponse } from 'next/server';
import { db } from '../../../../db/db';
import { companies } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db
      .select({
        id: companies.id,
        name: companies.name,
        logoUrl: companies.logo_url,
      })
      .from(companies)
      .where(eq(companies.status, 'active'));

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve divisions' }, { status: 500 });
  }
}
