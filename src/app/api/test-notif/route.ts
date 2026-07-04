import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to');
  if (!to) {
    return NextResponse.json({ error: 'Pass ?to=your@email.com' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set in environment' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from:    'Flowxiq <noreply@flowxiq.com>',
    to:      [to],
    subject: 'Flowxiq email test',
    html:    '<p>This is a test email from Flowxiq. If you received this, email delivery is working ✅</p>',
  });

  return NextResponse.json({
    to,
    apiKeyPrefix: apiKey.slice(0, 8) + '...',
    result,
  });
}
