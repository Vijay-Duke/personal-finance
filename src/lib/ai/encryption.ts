import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derive a 32-byte key from the master key and a unique salt using scrypt.
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return scryptSync(masterKey, salt, 32);
}

/**
 * Encrypt text using AES-256-GCM.
 * Returns: version:salt:iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }

  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(ENCRYPTION_KEY!, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return v1:salt:iv:authTag:encrypted
  return `v1:${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt().
 * Supports v1 format: v1:salt:iv:authTag:encrypted
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');

  if (parts.length !== 5) {
    throw new Error('Invalid encrypted data format');
  }

  const [version, saltHex, ivHex, authTagHex, encrypted] = parts;

  if (version !== 'v1') {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  if (!saltHex || !ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }

  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  if (salt.length !== SALT_LENGTH) {
    throw new Error('Invalid salt length');
  }
  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const key = deriveKey(ENCRYPTION_KEY!, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed - data may be corrupted or tampered with');
  }
}
