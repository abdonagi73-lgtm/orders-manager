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
    logger.info('Clover pushProducts', { count: products.length });
    return {
      provider: 'clover', pushed: 0, failed: 0, skipped: products.length,
      errors: ['Live product sync coming in V2.'], syncedAt: new Date().toISOString(),
    };
  },
};
