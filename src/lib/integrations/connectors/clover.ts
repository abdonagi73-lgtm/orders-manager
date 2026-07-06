/**
 * Clover Connector
 */

import type { IntegrationConnector, ConnectorConfigField } from '../connector';
import type {
  CanonicalProduct, ConnectorConfig, ConnectionTestResult, SyncResult, CloverConfig,
} from '../types';
import { logger } from '@/lib/logger';

function asClover(c: ConnectorConfig): CloverConfig { return c as CloverConfig; }

export const cloverConnector: IntegrationConnector = {
  provider:    'clover',
  displayName: 'Clover',
  logoUrl:     '/integrations/clover-logo.svg',

  configFields: [
    {
      key:         'merchantId',
      label:       'Merchant ID',
      type:        'text',
      required:    true,
      placeholder: 'XXXXXXXXXXXXXXXX',
      helpText:    'Found in your Clover Developer Dashboard',
    },
    {
      key:         'accessToken',
      label:       'Access Token',
      type:        'password',
      required:    true,
      placeholder: 'Your Clover OAuth token',
    },
    {
      key:      'environment',
      label:    'Environment',
      type:     'select',
      required: true,
      options:  [
        { value: 'sandbox',    label: 'Sandbox' },
        { value: 'production', label: 'Production' },
      ],
    },
  ] satisfies ConnectorConfigField[],

  async testConnection(config: ConnectorConfig): Promise<ConnectionTestResult> {
    const cl = asClover(config);
    const base = cl.environment === 'production'
      ? 'https://api.clover.com'
      : 'https://apisandbox.dev.clover.com';

    try {
      const res = await fetch(`${base}/v3/merchants/${cl.merchantId}`, {
        headers: { Authorization: `Bearer ${cl.accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true, status: 'connected',
          message: `Connected to ${data.name ?? 'Clover merchant'} successfully`,
        };
      }

      return { success: false, status: 'error', message: `Clover API returned ${res.status}` };
    } catch (err) {
      return { success: false, status: 'error', message: `Connection failed: ${String(err)}` };
    }
  },

  async pushProducts(products: CanonicalProduct[], config: ConnectorConfig): Promise<SyncResult> {
    const cl = asClover(config);
    const base = cl.environment === 'production' 
      ? 'https://api.clover.com' 
      : 'https://apisandbox.dev.clover.com';
    logger.info('Clover pushProducts', { count: products.length });

    let pushed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        const res = await fetch(`${base}/v3/merchants/${cl.merchantId}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cl.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: product.name,
            price: Math.round((product.variants[0]?.price || 0) * 100), // clover price in cents
            sku: product.variants[0]?.sku || product.sku || '',
          })
        });

        if (res.ok) {
          pushed++;
        } else {
          failed++;
          errors.push(`Clover API returned status ${res.status} for "${product.name}"`);
        }
      } catch (err) {
        failed++;
        errors.push(`Error pushing to Clover: ${String(err)}`);
      }
    }

    return {
      provider: 'clover',
      pushed,
      failed,
      skipped: 0,
      errors: errors,
      syncedAt: new Date().toISOString(),
    };
  },
};
