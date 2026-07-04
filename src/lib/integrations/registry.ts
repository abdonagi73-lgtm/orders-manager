/**
 * Integration Connector Registry
 * Register all available connectors here.
 * Adding a new integration = implement IntegrationConnector + add one line here.
 */

import { squareConnector }     from './connectors/square';
import { shopifyConnector }    from './connectors/shopify';
import { cloverConnector }     from './connectors/clover';
import { lightspeedConnector } from './connectors/lightspeed';
import type { IntegrationConnector }  from './connector';
import type { IntegrationProvider }   from './types';

export const connectorRegistry: Record<IntegrationProvider, IntegrationConnector> = {
  square:     squareConnector,
  shopify:    shopifyConnector,
  clover:     cloverConnector,
  lightspeed: lightspeedConnector,
  woocommerce: {
    // Stub — not yet implemented
    provider:     'woocommerce',
    displayName:  'WooCommerce',
    logoUrl:      '/integrations/woocommerce-logo.svg',
    configFields: [],
    async testConnection() {
      return { success: false, status: 'error', message: 'WooCommerce integration coming soon.' };
    },
    async pushProducts(products) {
      return { provider: 'woocommerce', pushed: 0, failed: 0, skipped: products.length, errors: ['Coming soon.'], syncedAt: new Date().toISOString() };
    },
  },
  other: {
    provider:     'other',
    displayName:  'Custom',
    logoUrl:      '',
    configFields: [],
    async testConnection() {
      return { success: false, status: 'error', message: 'Custom integration not configured.' };
    },
    async pushProducts(products) {
      return { provider: 'other', pushed: 0, failed: 0, skipped: products.length, errors: ['Not configured.'], syncedAt: new Date().toISOString() };
    },
  },
};

/**
 * Get a connector by provider name. Returns null if not found.
 */
export function getConnector(provider: string): IntegrationConnector | null {
  return connectorRegistry[provider as IntegrationProvider] ?? null;
}

/**
 * Get all registered connectors as an array.
 */
export function getAllConnectors(): IntegrationConnector[] {
  return Object.values(connectorRegistry);
}

export type { IntegrationConnector, IntegrationProvider };
