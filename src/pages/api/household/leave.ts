import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { json, error } from '@/lib/api/response';
import { logActivity } from '@/lib/audit';

/**
 * POST /api/household/leave
 * Leave the current household.
 * Owners and super_admins cannot leave (must transfer ownership first).
 */
export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  if (auth.role === 'owner' || auth.role === 'super_admin') {
    return error('Owners and admins cannot leave the household. Transfer ownership first.', 400);
  }

  const householdId = auth.householdId!;

  await db
    .update(users)
    .set({ householdId: null, role: 'member', updatedAt: new Date() })
    .where(eq(users.id, auth.userId));

  await logActivity(householdId, auth.userId, 'member_left', {
    targetType: 'member',
    targetId: auth.userId,
  });

  return json({ success: true, message: 'You have left the household.' });
};
