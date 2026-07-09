import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { companies } from '@/db/schema';

export async function GET() {
  try {
    const list = await db.select().from(companies);
    return NextResponse.json({
      success: true,
      count: list.length,
      dbUrl: process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.slice(0, 30) : 'none'
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || String(err),
      stack: err.stack
    }, { status: 500 });
  }
}
