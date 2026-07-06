/**
 * Square Connector
 * Implements IntegrationConnector for Square POS.
 * Translates Flowxiq's canonical product model → Square Catalog API format.
 */

import type { IntegrationConnector, ConnectorConfigField } from '../connector';
import type {
  CanonicalProduct, ConnectorConfig, ConnectionTestResult, SyncResult, SquareConfig,
} from '../types';
import { logger } from '@/lib/logger';

function asSquare(config: ConnectorConfig): SquareConfig {
  return config as SquareConfig;
}

function squareApiBase(env: 'sandbox' | 'production'): string {
  return env === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

// ─── CSV Export (no API credentials needed) ────────────────────────────────

function productsToSquareCsv(products: CanonicalProduct[]): string {
  const rows: string[] = [];
  // Square catalog CSV header
  rows.push([
    'Token', 'Item Name', 'Variation Name', 'SKU', 'Description', 'Category',
    'Price Point Name', 'Price', 'Currency', 'Current Quantity Location 1',
    'New Quantity Location 1', 'Stock Alert Enabled Location 1',
    'Stock Alert Count Location 1',
  ].join(','));

  for (const product of products) {
    for (const variant of product.variants) {
      const variationName = [variant.color, variant.size].filter(Boolean).join(' / ') || 'Regular';
      rows.push([
        '',                              // Token (blank for import)
        `"${product.name.replace(/"/g, '""')}"`,
        `"${variationName}"`,
        variant.sku || product.sku,
        '',
        `"${product.category}"`,
        'Regular',
        variant.price.toFixed(2),
        'USD',
        '',
        '',
        'N',
        '',
      ].join(','));
    }
  }

  return rows.join('\n');
}

// ─── Connector Implementation ─────────────────────────────────────────────────

export const squareConnector: IntegrationConnector = {
  provider:    'square',
  displayName: 'Square',
  logoUrl:     '/integrations/square-logo.svg',

  configFields: [
    {
      key:         'accessToken',
      label:       'Access Token',
      type:        'password',
      required:    true,
      placeholder: 'EAAAl...',
      helpText:    'Found in your Square Developer Dashboard under Credentials',
    },
    {
      key:         'locationId',
      label:       'Location ID',
      type:        'text',
      required:    true,
      placeholder: 'LXXXXXXXXXXXX',
      helpText:    'Your Square location ID',
    },
    {
      key:      'environment',
      label:    'Environment',
      type:     'select',
      required: true,
      options: [
        { value: 'sandbox',    label: 'Sandbox (Testing)' },
        { value: 'production', label: 'Production (Live)' },
      ],
    },
  ] satisfies ConnectorConfigField[],

  async testConnection(config: ConnectorConfig): Promise<ConnectionTestResult> {
    const sq = asSquare(config);
    try {
      const res = await fetch(`${squareApiBase(sq.environment)}/v2/locations/${sq.locationId}`, {
        headers: {
          'Authorization': `Bearer ${sq.accessToken}`,
          'Square-Version': '2024-01-17',
        },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          status:  'connected',
          message: `Connected to ${data.location?.name ?? 'Square location'} successfully`,
          details: { locationName: data.location?.name },
        };
      }

      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        status:  'error',
        message: err.errors?.[0]?.detail ?? `Square API returned ${res.status}`,
      };
    } catch (err) {
      return { success: false, status: 'error', message: `Connection failed: ${String(err)}` };
    }
  },

  async pushProducts(products: CanonicalProduct[], config: ConnectorConfig): Promise<SyncResult> {
    const sq = asSquare(config);
    logger.info('Square pushProducts', { count: products.length, locationId: sq.locationId });

    try {
      const objects = products.map((product, pIdx) => {
        return {
          type: 'ITEM',
          id: `#item-${pIdx}`,
          present_at_all_locations: !sq.locationId,
          present_at_location_ids: sq.locationId ? [sq.locationId] : undefined,
          item_data: {
            name: product.name,
            description: '',
            category_id: undefined,
            variations: product.variants.map((v, vIdx) => ({
              type: 'ITEM_VARIATION',
              id: `#var-${pIdx}-${vIdx}`,
              present_at_all_locations: !sq.locationId,
              present_at_location_ids: sq.locationId ? [sq.locationId] : undefined,
              item_variation_data: {
                name: [v.color, v.size].filter(Boolean).join(' / ') || 'Regular',
                pricing_type: 'FIXED_PRICING',
                sku: v.sku || product.sku || '',
                price_money: {
                  amount: Math.round(v.price * 100), // cents
                  currency: 'USD',
                }
              }
            }))
          }
        };
      });

      const res = await fetch(`${squareApiBase(sq.environment)}/v2/catalog/batch-upsert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sq.accessToken}`,
          'Square-Version': '2024-01-17',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          batches: [{ objects }]
        })
      });

      if (res.ok) {
        return {
          provider:  'square',
          pushed:    products.length,
          failed:    0,
          skipped:   0,
          errors:    [],
          syncedAt:  new Date().toISOString(),
        };
      }

      const err = await res.json().catch(() => ({}));
      const errors = err.errors?.map((e: any) => e.detail).filter(Boolean) || [`Square API returned status ${res.status}`];
      return {
        provider:  'square',
        pushed:    0,
        failed:    products.length,
        skipped:   0,
        errors,
        syncedAt:  new Date().toISOString(),
      };
    } catch (err) {
      return {
        provider:  'square',
        pushed:    0,
        failed:    products.length,
        skipped:   0,
        errors:    [`Connection failed: ${String(err)}`],
        syncedAt:  new Date().toISOString(),
      };
    }
  },

  async generateExport(products: CanonicalProduct[]): Promise<{ content: string; filename: string; mimeType: string }> {
    const csv = productsToSquareCsv(products);
    const date = new Date().toISOString().slice(0, 10);
    return {
      content:  csv,
      filename: `SQUARE_EXPORT_${date}.csv`,
      mimeType: 'text/csv',
    };
  },
};
