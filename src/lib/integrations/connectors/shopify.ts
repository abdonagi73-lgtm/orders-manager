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
    const domain = sh.shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    logger.info('Shopify pushProducts', { count: products.length, shop: sh.shopDomain });

    let pushed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        const res = await fetch(`https://${domain}/admin/api/2024-01/products.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': sh.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product: {
              title: product.name,
              vendor: product.vendor,
              product_type: product.category,
              variants: product.variants.map(v => ({
                option1: v.color || 'Regular',
                option2: v.size || 'Regular',
                price: v.price.toString(),
                sku: v.sku || product.sku || '',
              })),
            }
          })
        });

        if (res.ok) {
          pushed++;
        } else {
          failed++;
          const errData = await res.json().catch(() => ({}));
          errors.push(`Failed to push "${product.name}": ${JSON.stringify(errData.errors || res.statusText)}`);
        }
      } catch (err) {
        failed++;
        errors.push(`Error pushing "${product.name}": ${String(err)}`);
      }
    }

    return {
      provider: 'shopify',
      pushed,
      failed,
      skipped: 0,
      errors: errors,
      syncedAt: new Date().toISOString(),
    };
  },
};
