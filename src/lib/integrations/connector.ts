/**
 * IntegrationConnector Interface
 * Every POS connector must implement this interface.
 * Adding a new integration = implementing this interface + registering in registry.ts.
 */

import type {
  CanonicalProduct,
  ConnectorConfig,
  ConnectionTestResult,
  SyncResult,
  IntegrationProvider,
} from './types';

export interface IntegrationConnector {
  /** Provider identifier — matches the provider column in the integrations table */
  readonly provider: IntegrationProvider;

  /** Human-readable name shown in the UI */
  readonly displayName: string;

  /** URL to provider's logo (used in integrations UI) */
  readonly logoUrl: string;

  /** Fields the user needs to fill in to connect (for dynamic form generation) */
  readonly configFields: ConnectorConfigField[];

  /**
   * Validate the provided credentials and return a connection status.
   * Must make an actual API call to verify the credentials work.
   */
  testConnection(config: ConnectorConfig): Promise<ConnectionTestResult>;

  /**
   * Push products from Flowxiq's canonical model to the provider's catalog.
   * Responsible for translating CanonicalProduct → provider-specific format.
   */
  pushProducts(products: CanonicalProduct[], config: ConnectorConfig): Promise<SyncResult>;

  /**
   * Pull products from the provider and return them in canonical format.
   * Used for inventory sync (future feature).
   */
  pullProducts?(config: ConnectorConfig): Promise<CanonicalProduct[]>;

  /**
   * Generate a provider-specific export file (e.g., CSV for Square).
   * Returns the file content as a string and the suggested filename.
   */
  generateExport?(products: CanonicalProduct[], config: ConnectorConfig): Promise<{
    content:  string;
    filename: string;
    mimeType: string;
  }>;
}

export interface ConnectorConfigField {
  key:         string;
  label:       string;
  type:        'text' | 'password' | 'select' | 'url';
  required:    boolean;
  placeholder?: string;
  options?:    { value: string; label: string }[];
  helpText?:   string;
}
