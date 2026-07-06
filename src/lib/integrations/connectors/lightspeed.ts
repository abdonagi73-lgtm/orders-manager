/**
 * Lightspeed Connector
 */

import type { IntegrationConnector, ConnectorConfigField } from '../connector';
import type {
  CanonicalProduct, ConnectorConfig, ConnectionTestResult, SyncResult, LightspeedConfig,
} from '../types';
import { logger } from '@/lib/logger';

function asLightspeed(c: ConnectorConfig): LightspeedConfig { return c as LightspeedConfig; }

export const lightspeedConnector: IntegrationConnector = {
  provider:    'lightspeed',
  displayName: 'Lightspeed',
  logoUrl:     '/integrations/lightspeed-logo.svg',

  configFields: [
    {
      key:         'accountId',
      label:       'Account ID',
      type:        'text',
      required:    true,
      placeholder: 'Your Lightspeed account ID',
    },
    {
      key:         'accessToken',
      label:       'Access Token',
      type:        'password',
      required:    true,
      placeholder: 'OAuth access token',
      helpText:    'Generate from Lightspeed Merchant → Account → API Access',
    },
    {
      key:         'refreshToken',
      label:       'Refresh Token',
      type:        'password',
      required:    true,
      placeholder: 'OAuth refresh token',
    },
  ] satisfies ConnectorConfigField[],

  async testConnection(config: ConnectorConfig): Promise<ConnectionTestResult> {
    const ls = asLightspeed(config);
    try {
      const res = await fetch(
        `https://api.lightspeedapp.com/API/V3/Account/${ls.accountId}.json`,
        { headers: { Authorization: `Bearer ${ls.accessToken}` } }
      );

      if (res.ok) {
        const data = await res.json();
        return {
          success: true, status: 'connected',
          message: `Connected to ${data.Account?.name ?? 'Lightspeed account'} successfully`,
        };
      }

      return { success: false, status: 'error', message: `Lightspeed API returned ${res.status}` };
    } catch (err) {
      return { success: false, status: 'error', message: `Connection failed: ${String(err)}` };
    }
  },

  async pushProducts(products: CanonicalProduct[], config: ConnectorConfig): Promise<SyncResult> {
    const ls = asLightspeed(config);
    logger.info('Lightspeed pushProducts', { count: products.length });

    let pushed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        const res = await fetch(`https://api.lightspeedapp.com/API/V3/Account/${ls.accountId}/Item.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ls.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: product.name,
            Prices: {
              ItemPrice: [
                {
                  amount: product.variants[0]?.price.toString() || '0.00',
                  useType: 'Default'
                }
              ]
            }
          })
        });

        if (res.ok) {
          pushed++;
        } else {
          failed++;
          errors.push(`Lightspeed API returned status ${res.status} for "${product.name}"`);
        }
      } catch (err) {
        failed++;
        errors.push(`Error pushing to Lightspeed: ${String(err)}`);
      }
    }

    return {
      provider: 'lightspeed',
      pushed,
      failed,
      skipped: 0,
      errors: errors,
      syncedAt: new Date().toISOString(),
    };
  },
};
