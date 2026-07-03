import { NextResponse } from 'next/server';

// Legacy test endpoint — Google Sheets notifications have been deprecated.
// Kept as a stub to avoid build errors from cached references.
export async function GET() {
  return NextResponse.json({
    ok: false,
    message: 'This endpoint is deprecated. Flowxiq uses a database-backed notification system.',
  }, { status: 410 });
}
