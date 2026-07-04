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
    logger.info('Lightspeed pushProducts', { count: products.length });
    return {
      provider: 'lightspeed', pushed: 0, failed: 0, skipped: products.length,
      errors: ['Live product sync coming in V2.'], syncedAt: new Date().toISOString(),
    };
  },
};
