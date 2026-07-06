/**
 * Integration Credential Encryption
 * AES-256-GCM symmetric encryption for POS integration credentials stored in the DB.
 * The encryption key comes from the PLATFORM_ENCRYPTION_KEY env var (64-char hex = 32 bytes).
 *
 * Usage:
 *   const encrypted = encryptCredentials({ apiKey: '...', storeId: '...' });
 *   const decrypted = decryptCredentials(encrypted); // returns original object
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Platform } from '@/config';
import { logger } from '@/lib/logger';

const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getKey(): Buffer {
  const hex = Platform.encryption.key;
  if (!hex || hex.length !== 64) {
    throw new Error('FATAL CONFIGURATION ERROR: PLATFORM_ENCRYPTION_KEY environment variable must be configured as a 64-character hex string (32 bytes).');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a credentials object to a base64 string.
 * Format: iv(12B) + authTag(16B) + ciphertext — all base64 encoded together.
 */
export function encryptCredentials(credentials: Record<string, unknown>): string {
  try {
    const key        = getKey();
    const iv         = randomBytes(IV_LENGTH);
    const cipher     = createCipheriv(ALGORITHM, key, iv);
    const plaintext  = Buffer.from(JSON.stringify(credentials), 'utf8');
    const encrypted  = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag    = cipher.getAuthTag();

    // Concatenate: IV | authTag | ciphertext → base64
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  } catch (error) {
    logger.error('encryptCredentials failed', { error: String(error) });
    throw new Error('Failed to encrypt integration credentials');
  }
}

/**
 * Decrypt a base64 credential string back to the original object.
 * Returns null if decryption fails (wrong key, tampered data).
 */
export function decryptCredentials(encrypted: string): Record<string, unknown> | null {
  try {
    const key    = getKey();
    const data   = Buffer.from(encrypted, 'base64');
    const iv      = data.slice(0, IV_LENGTH);
    const authTag = data.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const cipher  = data.slice(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(cipher), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    logger.error('decryptCredentials failed — possible key mismatch or data corruption', { error: String(error) });
    return null;
  }
}
