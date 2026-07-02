import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { accessRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/onboard/validate?token=xxx — validate an onboarding token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 });
  }

  try {
    const rows = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.onboarding_token, token));

    if (rows.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired token' }, { status: 404 });
    }

    const request = rows[0];

    if (request.status !== 'approved') {
      return NextResponse.json({ valid: false, error: 'Access request not approved' }, { status: 403 });
    }

    return NextResponse.json({
      valid: true,
      business_name: request.business_name,
      industry: request.industry,
      email: request.email,
      country: request.country,
    });
  } catch (err) {
    console.error('[onboard/validate]', err);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}
