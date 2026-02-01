import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session';
import { revokeApiKey } from '../../../lib/auth/api-keys';
import { db } from '../../../lib/db';
import { apiKeys } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, error, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/api-keys/[id]
 * Get a specific API key
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user) {
    return unauthorized('Please log in');
  }

  const { id } = context.params;
  if (!id) {
    return error('API key ID is required', 400);
  }

  try {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, session.user.id)
        )
      )
      .limit(1);

    if (!key) {
      return error('API key not found', 404);
    }

    return json({
      key: {
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
      },
    });
  } catch (err) {
    console.error('Error fetching API key:', err);
    return error('Failed to fetch API key', 500);
  }
};

/**
 * DELETE /api/api-keys/[id]
 * Revoke an API key
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user) {
    return unauthorized('Please log in');
  }

  const { id } = context.params;
  if (!id) {
    return error('API key ID is required', 400);
  }

  try {
    const success = await revokeApiKey(id, session.user.id);

    if (!success) {
      return error('API key not found or already revoked', 404);
    }

    return json({ message: 'API key revoked successfully' });
  } catch (err) {
    console.error('Error revoking API key:', err);
    return error('Failed to revoke API key', 500);
  }
};

/**
 * PATCH /api/api-keys/[id]
 * Update API key (name only)
 */
export const PATCH: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user) {
    return unauthorized('Please log in');
  }

  const { id } = context.params;
  if (!id) {
    return error('API key ID is required', 400);
  }

  try {
    const body = await context.request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return error('Name is required and must be 1-100 characters', 400);
    }

    // Check if key exists first
    const [existing] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return error('API key not found', 404);
    }

    await db
      .update(apiKeys)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, id));

    return json({ message: 'API key updated successfully' });
  } catch (err) {
    console.error('Error updating API key:', err);
    return error('Failed to update API key', 500);
  }
};
