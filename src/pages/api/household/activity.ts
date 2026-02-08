import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { json } from '@/lib/api/response';

/**
 * GET /api/household/activity
 * Get recent audit log entries for the current household.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const limit = Math.min(Number(context.url.searchParams.get('limit')) || 50, 100);

  const entries = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.householdId, auth.householdId!))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return json(entries);
};
