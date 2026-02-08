import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { json, error, notFound, noContent } from '@/lib/api/response';

/**
 * GET /api/user/sessions
 * List all active sessions for the current user.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const rows = await db
    .select({
      id: sessions.id,
      ipAddress: sessions.ipAddress,
      userAgent: sessions.userAgent,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, auth.userId));

  // Determine current session from cookie
  const cookieHeader = context.request.headers.get('cookie') || '';
  const sessionToken = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('better-auth.session_token='))
    ?.split('=')[1];

  const result = rows.map((row) => ({
    ...row,
    isCurrent: row.id === sessionToken || false,
    device: parseUserAgent(row.userAgent),
  }));

  return json(result);
};

/**
 * DELETE /api/user/sessions
 * Revoke a session by ID (query param ?id=...).
 */
export const DELETE: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const sessionId = context.url.searchParams.get('id');
  if (!sessionId) {
    return error('Session ID is required.', 400);
  }

  // Verify the session belongs to this user
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, auth.userId)
      )
    )
    .limit(1);

  if (!session) {
    return notFound('Session not found.');
  }

  await db.delete(sessions).where(eq(sessions.id, sessionId));

  return noContent();
};

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown device';

  // Simple UA parsing
  if (ua.includes('Mobile')) {
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
    if (ua.includes('Android')) return 'Android Device';
    return 'Mobile Device';
  }
  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Safari')) return 'Safari Browser';
  if (ua.includes('Edge')) return 'Edge Browser';
  return 'Desktop Browser';
}
