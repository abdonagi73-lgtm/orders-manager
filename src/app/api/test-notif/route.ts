import { NextResponse } from 'next/server';
import { addNotification } from '@/lib/sheets';

export async function GET() {
  try {
    await addNotification(
      'order_started', 'owner', 'w1', 'Test Worker',
      'test-order-id', 'Test Order', '', '',
      'Test notification from debug endpoint'
    );
    return NextResponse.json({ ok: true, message: 'Notification written' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, stack: e.stack }, { status: 500 });
  }
}
