import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { notificationPreferences, defaultNotificationPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { json, error } from '@/lib/api/response';

/**
 * GET /api/user/notification-preferences
 * Get the current user's notification preferences.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, auth.userId))
    .limit(1);

  const prefs = row ? JSON.parse(row.preferences) : defaultNotificationPreferences;

  return json(prefs);
};

/**
 * PATCH /api/user/notification-preferences
 * Update notification preferences (partial merge).
 */
export const PATCH: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const body = await context.request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return error('Invalid preferences object.', 400);
  }

  // Get existing or defaults
  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, auth.userId))
    .limit(1);

  const current = existing
    ? JSON.parse(existing.preferences)
    : { ...defaultNotificationPreferences };

  // Merge incoming preferences
  const merged = { ...current, ...body };
  const prefsJson = JSON.stringify(merged);

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ preferences: prefsJson, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, auth.userId));
  } else {
    await db.insert(notificationPreferences).values({
      userId: auth.userId,
      preferences: prefsJson,
    });
  }

  return json(merged);
};
