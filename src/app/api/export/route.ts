import { NextRequest, NextResponse } from 'next/server';
import { getItemsByOrder, getSettings, ensureVendorInRegistry, getAllOrders } from '@/lib/sheets';
import { itemToSquareRows, rowsToCSV } from '@/lib/pricing';

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const [items, settings, orders] = await Promise.all([
      getItemsByOrder(orderId), getSettings(), getAllOrders()
    ]);
    const order = orders.find(o => o.id === orderId);
    const exportable = items.filter(i => i.status !== 'flagged');
    if (!exportable.length) return NextResponse.json({ error: 'No items to export' }, { status: 400 });

    const allRows = [];
    for (const item of exportable) {
      const vendorCode = await ensureVendorInRegistry(item.vendor);
      allRows.push(...itemToSquareRows(item, vendorCode, settings));
    }

    const csv = rowsToCSV(allRows);
    const filename = `SQUARE_${order?.name.replace(/\s+/g,'_') ?? orderId}_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
