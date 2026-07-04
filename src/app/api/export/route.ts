/**
 * GET /api/export?orderId=xxx
 * Exports a Square-compatible CSV for all non-flagged items in an order.
 * Rewritten to use Turso DB (Drizzle) — no longer depends on Google Sheets.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { orders, orderItems } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { squareConnector } from '@/lib/integrations/connectors/square';
import type { CanonicalProduct, CanonicalVariant } from '@/lib/integrations/types';
import { err } from '@/lib/api/response';

async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return err('UNAUTHORIZED', 'Authentication required', 401);

    const orderId = req.nextUrl.searchParams.get('orderId');
    if (!orderId) return err('VALIDATION_ERROR', 'orderId is required', 400);

    // Fetch the order (scoped to company for multi-tenant safety)
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.company_id, session.companyId),
          isNull(orders.deleted_at)
        )
      )
      .limit(1);

    if (!order) return err('NOT_FOUND', 'Order not found', 404);

    // Fetch non-flagged, non-deleted items
    const items = await db
      .select()
      .from(orderItems)
      .where(
        and(
          eq(orderItems.order_id, orderId),
          isNull(orderItems.deleted_at)
        )
      );

    const exportable = items.filter((i) => i.status !== 'flagged');
    if (!exportable.length) {
      return err('VALIDATION_ERROR', 'No exportable items (all items are flagged or none exist)', 400);
    }

    // Convert to canonical products for the Square connector
    const canonical: CanonicalProduct[] = exportable.map((item) => {
      const colors: string[] = (() => {
        try { return JSON.parse(item.colors); } catch { return [item.colors].filter(Boolean); }
      })();
      const sizes: string[] = (() => {
        try { return JSON.parse(item.sizes); } catch { return [item.sizes].filter(Boolean); }
      })();

      // Generate variants from color × size combinations
      const variants: CanonicalVariant[] = [];
      if (colors.length && sizes.length) {
        for (const color of colors) {
          for (const size of sizes) {
            variants.push({
              sku:   `${item.code}-${color.replace(/\s+/g, '')}-${size.replace(/\s+/g, '')}`.toUpperCase(),
              color,
              size,
              price: item.price,
              cost:  item.price * 0.5, // default 50% margin — configurable in settings V2
            });
          }
        }
      } else {
        variants.push({
          sku:   item.code,
          price: item.price,
          cost:  item.price * 0.5,
        });
      }

      return {
        internalId:  item.id,
        sku:         item.code,
        name:        `${item.vendor} - ${item.code}`,
        category:    item.category,
        vendor:      item.vendor,
        variants,
        basePrice:   item.price,
        baseCost:    item.price * 0.5,
      };
    });

    // Use Square connector to generate the CSV
    const exported = await squareConnector.generateExport!(canonical, {});
    const orderNameSafe = order.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `SQUARE_${orderNameSafe}_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(exported.content, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error('[export]', error);
    return err('INTERNAL_ERROR', 'Export failed', 500);
  }
}
