import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session';
import { createApiKey, listUserApiKeys } from '../../../lib/auth/api-keys';
import { json, error, unauthorized } from '../../../lib/api/response';
import type { ApiKeyScope, ApiKeySource } from '../../../lib/db/schema';

/**
 * GET /api/api-keys
 * List all API keys for the current user
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user) {
    return unauthorized('Please log in');
  }

  try {
    const keys = await listUserApiKeys(session.user.id);

    // Don't expose the key hash, return safe info only
    const safeKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      displayKey: key.displayKey,
      scope: key.scope,
      source: key.source,
      lastUsedAt: key.lastUsedAt?.toISOString() || null,
      requestCount: key.requestCount,
      expiresAt: key.expiresAt?.toISOString() || null,
      revokedAt: key.revokedAt?.toISOString() || null,
      createdAt: key.createdAt.toISOString(),
      isActive: !key.revokedAt && (!key.expiresAt || key.expiresAt > new Date()),
    }));

    return json({ keys: safeKeys });
  } catch (err) {
    console.error('Error listing API keys:', err);
    return error('Failed to list API keys', 500);
  }
};

/**
 * POST /api/api-keys
 * Create a new API key
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user) {
    return unauthorized('Please log in');
  }

  try {
    const body = await context.request.json();
    const { name, scope, expiresInDays } = body;

    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return error('Name is required and must be 1-100 characters', 400);
    }

    const validScopes: ApiKeyScope[] = ['read', 'read_write'];
    const keyScope: ApiKeyScope = validScopes.includes(scope) ? scope : 'read';

    // Calculate expiration date if provided
    let expiresAt: Date | undefined;
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const { apiKey, plainKey } = await createApiKey(session.user.id, name, {
      scope: keyScope,
      source: 'web' as ApiKeySource,
      expiresAt,
    });

    // Return the plain key - this is the ONLY time it will be visible
    return json({
      key: {
        id: apiKey.id,
        name: apiKey.name,
        displayKey: apiKey.displayKey,
        scope: apiKey.scope,
        source: apiKey.source,
        expiresAt: apiKey.expiresAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
      },
      // The full key - only shown once!
      plainKey,
      message: 'API key created successfully. Save this key now - it will not be shown again.',
    }, 201);
  } catch (err) {
    console.error('Error creating API key:', err);
    return error('Failed to create API key', 500);
  }
};
