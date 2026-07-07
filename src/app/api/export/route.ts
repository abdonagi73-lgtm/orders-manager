/**
 * GET /api/export?orderId=xxx
 * Exports a Square-compatible CSV for all non-flagged items in an order.
 * Rewritten to use Turso DB (Drizzle) — no longer depends on Google Sheets.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/auth';
import { db } from '@/db/db';
import { orders, orderItems, settings } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { squareConnector } from '@/lib/integrations/connectors/square';
import type { CanonicalProduct, CanonicalVariant } from '@/lib/integrations/types';
import { err } from '@/lib/api/response';

function productsToCustomCsv(
  products: CanonicalProduct[],
  template: { headers: string[]; mapping: Record<string, string>; constants: Record<string, string>; delimiter?: string }
): string {
  const { headers, mapping, constants } = template;
  const delim = template.delimiter || ',';
  const rows: string[] = [headers.join(delim)];

  for (const product of products) {
    const isVariable = product.variants.length > 1 || (product.variants[0]?.color || product.variants[0]?.size);
    const rowValues = headers.map(header => {
      const field = mapping[header];
      if (field) {
        if (field === 'item_name') {
          return `"${product.name.replace(/"/g, '""')}"`;
        }
        if (field === 'vendor') {
          return `"${product.vendor.replace(/"/g, '""')}"`;
        }
        if (field === 'category') {
          return `"${product.category.replace(/"/g, '""')}"`;
        }
        if (field === 'base_sku') {
          return `"${product.sku.replace(/"/g, '""')}"`;
        }
        if (field === 'product_type') {
          return isVariable ? 'variable' : 'single';
        }
        if (field === 'variation_name') {
          return isVariable ? 'Size-Color' : '';
        }
        if (field === 'variation_values') {
          if (!isVariable) return '';
          return `"${product.variants.map(v => [v.size, v.color].filter(Boolean).join('-')).join('|')}"`;
        }
        if (field === 'variation_skus') {
          if (!isVariable) return '';
          return `"${product.variants.map(v => v.sku || '').join('|')}"`;
        }
        if (field === 'purchase_price') {
          if (!isVariable) return (product.baseCost || (product.basePrice * 0.5)).toFixed(2);
          return `"${product.variants.map(v => (v.cost || (v.price * 0.5)).toFixed(2)).join('|')}"`;
        }
        if (field === 'selling_price') {
          if (!isVariable) return product.basePrice.toFixed(2);
          return `"${product.variants.map(v => v.price.toFixed(2)).join('|')}"`;
        }
        if (field === 'opening_stock') {
          if (!isVariable) return '10';
          return `"${product.variants.map(() => '10').join('|')}"`;
        }
        if (field === 'photo') {
          return product.imageUrl ? `"${product.imageUrl}"` : '';
        }
      }
      // Fallback to constants
      const constVal = constants[header];
      if (constVal !== undefined) {
        return `"${constVal.replace(/"/g, '""')}"`;
      }
      return '';
    });
    rows.push(rowValues.join(delim));
  }

  return rows.join('\n');
}

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
        imageUrl:    item.photo || '',
      };
    });

    const format = req.nextUrl.searchParams.get('format');
    const orderNameSafe = order.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');

    if (format === 'custom') {
      const [customRow] = await db
        .select()
        .from(settings)
        .where(and(eq(settings.company_id, session.companyId), eq(settings.key, 'pos_csv_template')))
        .limit(1);

      if (customRow) {
        try {
          const template = JSON.parse(customRow.value);
          const csvContent = productsToCustomCsv(canonical, template);
          const filename = `POS_EXPORT_${orderNameSafe}_${new Date().toISOString().slice(0, 10)}.csv`;
          return new NextResponse(csvContent, {
            headers: {
              'Content-Type':        'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          });
        } catch (e: any) {
          console.error('[export custom parsing]', e);
        }
      }
    }

    // Use Square connector to generate the CSV
    const exported = await squareConnector.generateExport!(canonical, {});
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
