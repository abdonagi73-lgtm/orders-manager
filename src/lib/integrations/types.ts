/**
 * Integration Framework — Canonical Internal Data Model
 * All POS connectors translate TO and FROM this model.
 * Flowxiq owns this schema — providers adapt to it, not the other way around.
 */

export type IntegrationProvider = 'square' | 'shopify' | 'clover' | 'lightspeed' | 'woocommerce' | 'other';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

// ─── Canonical Product Model ──────────────────────────────────────────────────

export interface CanonicalVariant {
  sku:       string;
  color?:    string;
  size?:     string;
  price:     number;    // retail price
  cost?:     number;    // cost price
  quantity?: number;
}

export interface CanonicalProduct {
  internalId:   string;     // Flowxiq order_items.id
  sku:          string;
  name:         string;
  description?: string;
  category:     string;
  vendor:       string;
  variants:     CanonicalVariant[];
  basePrice:    number;     // retail price
  baseCost?:    number;     // cost price
  weight?:      number;     // in lbs
  imageUrl?:    string;
}

// ─── Sync Result ──────────────────────────────────────────────────────────────

export interface SyncResult {
  provider:    IntegrationProvider;
  pushed:      number;
  failed:      number;
  skipped:     number;
  errors:      string[];
  syncedAt:    string;
}

// ─── Connector Config (provider-specific, encrypted in DB) ───────────────────

export interface SquareConfig {
  accessToken:  string;
  locationId:   string;
  environment:  'sandbox' | 'production';
}

export interface ShopifyConfig {
  shopDomain:   string;   // e.g. mystore.myshopify.com
  accessToken:  string;
}

export interface CloverConfig {
  merchantId:   string;
  accessToken:  string;
  environment:  'sandbox' | 'production';
}

export interface LightspeedConfig {
  accountId:   string;
  accessToken: string;
  refreshToken: string;
}

export type ConnectorConfig =
  | SquareConfig
  | ShopifyConfig
  | CloverConfig
  | LightspeedConfig
  | Record<string, unknown>;

// ─── Test Result ─────────────────────────────────────────────────────────────

export interface ConnectionTestResult {
  success:  boolean;
  status:   IntegrationStatus;
  message:  string;
  details?: Record<string, unknown>;
}
