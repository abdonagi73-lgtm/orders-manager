// src/app/api/export/route.ts
import { NextResponse } from 'next/server';
import { getAllItems, getSettings, ensureVendorInRegistry } from '@/lib/sheets';
import { itemToSquareRows, rowsToCSV } from '@/lib/pricing';

export async function GET() {
  try {
    const [items, settings] = await Promise.all([getAllItems(), getSettings()]);

    const exportableItems = items.filter(i => i.status !== 'flagged');
    if (exportableItems.length === 0) {
      return NextResponse.json({ error: 'No items to export' }, { status: 400 });
    }

    const allRows = [];
    for (const item of exportableItems) {
      const vendorCode = await ensureVendorInRegistry(item.vendor);
      const rows = itemToSquareRows(item, vendorCode, settings);
      allRows.push(...rows);
    }

    const csv = rowsToCSV(allRows);
    const filename = `SQUARE_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
