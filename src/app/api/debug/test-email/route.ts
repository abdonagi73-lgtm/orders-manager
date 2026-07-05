/**
 * TEMPORARY DEBUG ENDPOINT — remove before final launch
 * GET /api/debug/test-email?to=your@email.com
 * Calls Resend directly and returns the full response/error
 */
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
  const to  = req.nextUrl.searchParams.get('to');
  const key = process.env.RESEND_API_KEY;

  if (!to) {
    return NextResponse.json({ error: 'Pass ?to=your@email.com' }, { status: 400 });
  }

  // 1. Check key exists
  if (!key) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set in environment variables' }, { status: 500 });
  }

  // 2. Try to send a test email
  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from:    'Flowxiq <noreply@flowxiq.com>',
    to:      [to],
    subject: 'Flowxiq Email Test',
    html:    '<p>If you see this, Resend is working correctly.</p>',
  });

  if (error) {
    // Return the full Resend error so we can diagnose
    return NextResponse.json({
      success: false,
      resendError: error,
      hint: error.name === 'validation_error'
        ? 'Domain flowxiq.com may not be verified in Resend. Go to resend.com → Domains and verify it, or change the from address to onboarding@resend.dev'
        : 'Check your RESEND_API_KEY and domain settings in Resend dashboard',
    }, { status: 500 });
  }

  return NextResponse.json({ success: true, emailId: data?.id });
}
