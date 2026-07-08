import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { accessRequests } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// POST /api/access-requests — public, no auth required
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      business_name, industry, country, email, whatsapp, num_workers, current_system,
      owner_name, business_type, state_province, city, timezone, currency, language,
      website, tax_id, phone
    } = body;

    if (!business_name || !industry || !country || !email || !owner_name) {
      return NextResponse.json({ error: 'Missing required fields (Business Name, Owner Name, Industry, Country, Email)' }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await db.insert(accessRequests).values({
      id,
      business_name: String(business_name).trim(),
      industry: String(industry).trim(),
      country: String(country).trim(),
      email: String(email).trim().toLowerCase(),
      whatsapp: String(whatsapp || '').trim(),
      num_workers: Number(num_workers) || 1,
      current_system: String(current_system || '').trim(),
      status: 'pending',
      onboarding_token: '',
      notes: '',
      owner_name: String(owner_name).trim(),
      business_type: String(business_type || 'retail').trim(),
      state_province: String(state_province || '').trim(),
      city: String(city || '').trim(),
      timezone: String(timezone || 'UTC').trim(),
      currency: String(currency || 'USD').trim(),
      language: String(language || 'en').trim(),
      website: String(website || '').trim(),
      tax_id: String(tax_id || '').trim(),
      phone: String(phone || whatsapp || '').trim(),
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    // Surface the actual DB error so we can debug
    const message = err?.message || String(err);
    console.error('[access-requests POST] DB ERROR:', message);
    return NextResponse.json(
      { error: 'Database error', detail: message },
      { status: 500 }
    );
  }
}

// GET /api/access-requests — super_admin only (enforced in middleware)
export async function GET() {
  try {
    const rows = await db.select().from(accessRequests).orderBy(desc(accessRequests.created_at));
    return NextResponse.json(rows);
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error('[access-requests GET] DB ERROR:', message);
    return NextResponse.json({ error: 'Database error', detail: message }, { status: 500 });
  }
}
