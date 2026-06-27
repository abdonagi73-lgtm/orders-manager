import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getItemsByOrder, updateOrder } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin');
  if (pin !== process.env.OWNER_PIN) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const orders = await getAllOrders();
  const results = [];

  for (const order of orders) {
    const items = await getItemsByOrder(order.id);
    const itemCount = items.length;
    const totalValue = parseFloat(items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2));
    const updated = { ...order, itemCount, totalValue };
    await updateOrder(updated);
    results.push({ order: order.name, itemCount, totalValue });
  }

  return NextResponse.json({ ok: true, repaired: results.length, results });
}
