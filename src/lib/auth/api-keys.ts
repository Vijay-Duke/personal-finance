/**
 * API Key Authentication Utilities
 * Handles generation, hashing, and verification of API keys
 */

import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { apiKeys, type ApiKey, type ApiKeyScope, type ApiKeySource } from '@/lib/db/schema';
import { eq, and, isNull, or, gt } from 'drizzle-orm';

// API Key prefix for easy identification
const API_KEY_PREFIX = 'pfk_'; // personal finance key

/**
 * Generate a new API key
 * Returns the plain key (shown once to user) and the hash for storage
 */
export function generateApiKey(): { plainKey: string; keyHash: string; displayKey: string } {
  // Generate 32 random bytes and encode as base64url
  const randomPart = randomBytes(32).toString('base64url');
  const plainKey = `${API_KEY_PREFIX}${randomPart}`;

  // Hash the key for secure storage
  const keyHash = hashApiKey(plainKey);

  // Display key is the prefix + first 8 chars
  const displayKey = `${API_KEY_PREFIX}${randomPart.substring(0, 8)}...`;

  return { plainKey, keyHash, displayKey };
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(plainKey: string): string {
  return createHash('sha256').update(plainKey).digest('hex');
}

/**
 * Verify an API key against a hash
 */
export function verifyApiKey(plainKey: string, keyHash: string): boolean {
  const computedHash = hashApiKey(plainKey);
  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(computedHash, keyHash);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: string,
  name: string,
  options: {
    scope?: ApiKeyScope;
    source?: ApiKeySource;
    expiresAt?: Date;
  } = {}
): Promise<{ apiKey: ApiKey; plainKey: string }> {
  const { scope = 'read', source = 'web', expiresAt } = options;

  const { plainKey, keyHash, displayKey } = generateApiKey();

  const [apiKey] = await db.insert(apiKeys).values({
    id: crypto.randomUUID(),
    userId,
    name,
    keyHash,
    displayKey,
    scope,
    source,
    expiresAt,
  }).returning();

  return { apiKey, plainKey };
}

/**
 * Find and validate an API key
 * Returns the key if valid, null otherwise
 */
export async function findValidApiKey(plainKey: string): Promise<ApiKey | null> {
  if (!plainKey || !plainKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(plainKey);
  const now = new Date();

  // Find active key (not revoked, not expired)
  const [key] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt),
        or(
          isNull(apiKeys.expiresAt),
          gt(apiKeys.expiresAt, now)
        )
      )
    )
    .limit(1);

  return key || null;
}

/**
 * Update the last used timestamp and increment request count
 */
export async function updateApiKeyUsage(keyId: string): Promise<void> {
  // First get current count, then update
  const [key] = await db
    .select({ requestCount: apiKeys.requestCount })
    .from(apiKeys)
    .where(eq(apiKeys.id, keyId));

  if (key) {
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        requestCount: key.requestCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));
  }
}

/**
 * Increment request count (simple version)
 */
export async function incrementApiKeyUsage(keyId: string): Promise<void> {
  const [key] = await db
    .select({ requestCount: apiKeys.requestCount })
    .from(apiKeys)
    .where(eq(apiKeys.id, keyId));

  if (key) {
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        requestCount: key.requestCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  // Check if the key exists and belongs to user first
  const [existing] = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, userId),
        isNull(apiKeys.revokedAt)
      )
    )
    .limit(1);

  if (!existing) {
    return false;
  }

  await db
    .update(apiKeys)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, keyId));

  return true;
}

/**
 * List all API keys for a user
 */
export async function listUserApiKeys(userId: string): Promise<ApiKey[]> {
  return db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(apiKeys.createdAt);
}

/**
 * Check if scope allows the requested action
 */
export function checkScope(keyScope: ApiKeyScope, requiredScope: 'read' | 'write'): boolean {
  if (requiredScope === 'read') {
    // Both 'read' and 'read_write' allow read access
    return keyScope === 'read' || keyScope === 'read_write';
  }

  if (requiredScope === 'write') {
    // Only 'read_write' allows write access
    return keyScope === 'read_write';
  }

  return false;
}

/**
 * API Key context for authenticated requests
 */
export interface ApiKeyContext {
  apiKey: ApiKey;
  userId: string;
  scope: ApiKeyScope;
}
