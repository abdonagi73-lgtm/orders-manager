/**
 * Shopify Connector
 * Implements IntegrationConnector for Shopify.
 * Translates Flowxiq canonical products → Shopify Product API format.
 */

import type { IntegrationConnector, ConnectorConfigField } from '../connector';
import type {
  CanonicalProduct, ConnectorConfig, ConnectionTestResult, SyncResult, ShopifyConfig,
} from '../types';
import { logger } from '@/lib/logger';

function asShopify(config: ConnectorConfig): ShopifyConfig {
  return config as ShopifyConfig;
}

export const shopifyConnector: IntegrationConnector = {
  provider:    'shopify',
  displayName: 'Shopify',
  logoUrl:     '/integrations/shopify-logo.svg',

  configFields: [
    {
      key:         'shopDomain',
      label:       'Shop Domain',
      type:        'url',
      required:    true,
      placeholder: 'mystore.myshopify.com',
      helpText:    'Your Shopify store domain',
    },
    {
      key:         'accessToken',
      label:       'Admin API Access Token',
      type:        'password',
      required:    true,
      placeholder: 'shpat_...',
      helpText:    'Create a private app in your Shopify Admin → Apps → Develop apps',
    },
  ] satisfies ConnectorConfigField[],

  async testConnection(config: ConnectorConfig): Promise<ConnectionTestResult> {
    const sh = asShopify(config);
    const domain = sh.shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
      const res = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': sh.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          status:  'connected',
          message: `Connected to ${data.shop?.name ?? 'Shopify store'} successfully`,
          details: { shopName: data.shop?.name, domain: data.shop?.domain },
        };
      }

      return {
        success: false,
        status:  'error',
        message: `Shopify API returned ${res.status}. Check your access token.`,
      };
    } catch (err) {
      return { success: false, status: 'error', message: `Connection failed: ${String(err)}` };
    }
  },

  async pushProducts(products: CanonicalProduct[], config: ConnectorConfig): Promise<SyncResult> {
    const sh = asShopify(config);
    logger.info('Shopify pushProducts', { count: products.length, shop: sh.shopDomain });

    // TODO: Implement Shopify Product API batch create/update in V2
    return {
      provider: 'shopify',
      pushed:   0,
      failed:   0,
      skipped:  products.length,
      errors:   ['Live product sync coming in V2.'],
      syncedAt: new Date().toISOString(),
    };
  },
};
