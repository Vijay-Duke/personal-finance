/**
 * API Authentication Middleware
 * Handles both session-based and API key authentication for API routes
 */

import type { APIContext } from 'astro';
import { getSession } from './session';
import { findValidApiKey, incrementApiKeyUsage, checkScope } from './api-keys';
import type { ApiKeyScope } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { json, error, unauthorized as baseUnauthorized, forbidden as baseForbidden } from '@/lib/api/response';

export interface AuthenticatedContext {
  type: 'session' | 'api_key';
  userId: string;
  householdId: string | null;
  scope?: ApiKeyScope;
  apiKeyId?: string;
}

/**
 * Authenticate an API request
 * Supports both session cookies and X-Api-Key header
 */
export async function authenticateApiRequest(
  context: APIContext
): Promise<AuthenticatedContext | null> {
  // First, check for API key in header
  const apiKeyHeader = context.request.headers.get('X-Api-Key');

  if (apiKeyHeader) {
    return authenticateWithApiKey(apiKeyHeader);
  }

  // Fall back to session-based auth
  return authenticateWithSession(context);
}

/**
 * Authenticate using API key
 */
async function authenticateWithApiKey(
  apiKey: string
): Promise<AuthenticatedContext | null> {
  const key = await findValidApiKey(apiKey);

  if (!key) {
    return null;
  }

  // Update usage statistics
  await incrementApiKeyUsage(key.id);

  // Get the user's household ID (using top-level imports for performance)
  const [user] = await db
    .select({ householdId: users.householdId })
    .from(users)
    .where(eq(users.id, key.userId))
    .limit(1);

  return {
    type: 'api_key',
    userId: key.userId,
    householdId: user?.householdId || null,
    scope: key.scope,
    apiKeyId: key.id,
  };
}

/**
 * Authenticate using session cookie
 */
async function authenticateWithSession(
  context: APIContext
): Promise<AuthenticatedContext | null> {
  const session = await getSession(context);

  if (!session?.user) {
    return null;
  }

  return {
    type: 'session',
    userId: session.user.id,
    householdId: session.user.householdId || null,
    // Session users have full read_write access
    scope: 'read_write',
  };
}

/**
 * Re-export response helpers for convenience
 * These use the canonical implementations from lib/api/response.ts
 */
export const apiUnauthorized = baseUnauthorized;
export const apiForbidden = baseForbidden;
export const apiError = error;
export const apiJson = json;

/**
 * Require authentication for an API route
 * Usage: const auth = await requireAuth(context); if (!auth) return;
 */
export async function requireAuth(
  context: APIContext,
  options: { requireHousehold?: boolean; requireScope?: 'read' | 'write' } = {}
): Promise<AuthenticatedContext | Response> {
  const { requireHousehold = true, requireScope = 'read' } = options;

  const auth = await authenticateApiRequest(context);

  if (!auth) {
    return apiUnauthorized('Authentication required. Use session cookie or X-Api-Key header.');
  }

  // Check household requirement
  if (requireHousehold && !auth.householdId) {
    return apiForbidden('You must belong to a household to access this resource.');
  }

  // Check scope requirement
  if (auth.scope && !checkScope(auth.scope, requireScope)) {
    return apiForbidden(`This action requires '${requireScope}' permission. Your API key has '${auth.scope}' scope.`);
  }

  return auth;
}

/**
 * Helper to check if requireAuth returned an error response
 */
export function isAuthError(result: AuthenticatedContext | Response): result is Response {
  return result instanceof Response;
}
