import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { chatMessages } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { decryptSession } from '@/lib/auth';

async function getSession(req: NextRequest) {
  // 1. Try Bearer token (worker portal — tab-isolated, no shared cookie)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token) return decryptSession(token);
  }
  // 2. Fall back to session cookie (manager/admin portal)
  const token = req.headers.get('cookie')?.split('; ').find(r => r.startsWith('session='))?.split('=')[1];
  if (!token) return null;
  return decryptSession(token);
}

// GET: Fetch conversation messages
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId'); // Used by managers to select specific worker conversation

    let list;
    if (session.role === 'worker') {
      // Worker only sees their own messages (sent or received)
      list = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.company_id, session.companyId),
            or(
              eq(chatMessages.sender_id, session.id),
              eq(chatMessages.recipient_id, session.id)
            )
          )
        )
        .orderBy(asc(chatMessages.created_at));
    } else {
      // Manager/Admin/Owner
      if (workerId) {
        // Fetch specific worker conversation
        list = await db
          .select()
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.company_id, session.companyId),
              or(
                and(eq(chatMessages.sender_id, workerId), eq(chatMessages.sender_role, 'worker')),
                eq(chatMessages.recipient_id, workerId)
              )
            )
          )
          .orderBy(asc(chatMessages.created_at));
      } else {
        // Fetch all messages for company overview
        list = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.company_id, session.companyId))
          .orderBy(asc(chatMessages.created_at));
      }
    }

    return NextResponse.json({ success: true, messages: list });
  } catch (error: any) {
    console.error('[chat GET]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send a new message
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, recipientId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
    }

    const id = `msg_${Date.now()}`;
    await db.insert(chatMessages).values({
      id,
      company_id: session.companyId,
      sender_id: session.id,
      sender_name: session.name,
      sender_role: session.role,
      recipient_id: recipientId || null,
      message: message.trim(),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[chat POST]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
