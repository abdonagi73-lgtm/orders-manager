import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { accessRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// PATCH /api/access-requests/[id] — approve or reject, super_admin only
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, notes } = body as { status: 'approved' | 'rejected'; notes?: string };

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Generate a unique single-use onboarding token when approving
    const onboarding_token = status === 'approved' ? randomUUID() : '';
    const now = new Date().toISOString();

    await db
      .update(accessRequests)
      .set({
        status,
        onboarding_token,
        notes: notes || '',
        updated_at: now,
      })
      .where(eq(accessRequests.id, id));

    const onboarding_url = status === 'approved'
      ? `/signup?token=${onboarding_token}`
      : null;

    return NextResponse.json({ success: true, status, onboarding_url, onboarding_token });
  } catch (err) {
    console.error('[access-requests PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
