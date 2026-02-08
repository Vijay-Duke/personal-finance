import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { json, error } from '@/lib/api/response';
import { logActivity } from '@/lib/audit';

/**
 * DELETE /api/user/account
 * Delete the current user's account.
 * Requires confirmation by typing email address.
 * Prevents deletion if user is the last owner of a household.
 */
export const DELETE: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const body = await context.request.json().catch(() => ({}));
  const { confirmEmail } = body;

  // Get user's email for verification
  const [user] = await db
    .select({ email: users.email, role: users.role, householdId: users.householdId })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1);

  if (!user) {
    return error('User not found.', 404);
  }

  if (!confirmEmail || confirmEmail !== user.email) {
    return error('Email confirmation does not match.', 400);
  }

  // If user is an owner, check they aren't the last owner
  if (user.householdId && (user.role === 'owner' || user.role === 'super_admin')) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.householdId, user.householdId),
          sql`${users.role} IN ('owner', 'super_admin')`,
          sql`${users.id} != ${auth.userId}`
        )
      );

    if (count === 0) {
      return error('You are the last owner. Transfer ownership before deleting your account.', 400);
    }
  }

  // Log activity before deletion
  if (user.householdId) {
    await logActivity(user.householdId, auth.userId, 'member_left', {
      targetType: 'member',
      targetId: auth.userId,
      details: { reason: 'account_deleted' },
    });
  }

  // Delete sessions first
  await db.delete(sessions).where(eq(sessions.userId, auth.userId));

  // Delete the user (cascade will handle auth_accounts, etc.)
  await db.delete(users).where(eq(users.id, auth.userId));

  return json({ success: true, message: 'Account deleted.' });
};
