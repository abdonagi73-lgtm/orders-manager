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

    // TODO: Implement Square Catalog API batch upsert in V2
    // For now, return a "not yet implemented" result pointing to CSV export
    return {
      provider:  'square',
      pushed:    0,
      failed:    0,
      skipped:   products.length,
      errors:    ['Live catalog push coming in V2. Use CSV export in the meantime.'],
      syncedAt:  new Date().toISOString(),
    };
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
