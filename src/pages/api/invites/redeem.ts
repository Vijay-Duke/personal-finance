import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { householdInvites, inviteUsages, users } from '@/lib/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { json, error } from '@/lib/api/response';
import { getAppSettings } from '@/lib/config/app-settings';
import { logActivity } from '@/lib/audit';

/**
 * POST /api/invites/redeem
 * Redeem an invite code to join a household.
 * For users who are already authenticated but don't have a household,
 * or want to switch households.
 */
export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  // User must not already belong to a household
  if (auth.householdId) {
    return error('You already belong to a household. Leave your current household first.', 400);
  }

  const body = await context.request.json().catch(() => ({}));
  const code = (body.code as string)?.toUpperCase().trim();

  if (!code) {
    return error('Invite code is required.', 400);
  }

  const [invite] = await db
    .select()
    .from(householdInvites)
    .where(
      and(
        eq(householdInvites.code, code),
        isNull(householdInvites.revokedAt)
      )
    )
    .limit(1);

  if (!invite) {
    return error('Invalid invite code.', 400);
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return error('This invite code has expired.', 400);
  }

  if (invite.useCount >= invite.maxUses) {
    return error('This invite code has reached its maximum uses.', 400);
  }

  // Check household member limit
  const settings = await getAppSettings();
  if (settings.maxUsersPerHousehold > 0) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.householdId, invite.householdId));

    if (count >= settings.maxUsersPerHousehold) {
      return error('This household has reached its maximum member limit.', 400);
    }
  }

  // Join household, increment usage, and log — all in a transaction
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        householdId: invite.householdId,
        role: invite.assignedRole as 'owner' | 'member',
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.userId));

    await tx
      .update(householdInvites)
      .set({ useCount: invite.useCount + 1 })
      .where(eq(householdInvites.id, invite.id));

    await tx.insert(inviteUsages).values({
      inviteId: invite.id,
      usedBy: auth.userId,
    });
  });

  await logActivity(invite.householdId, auth.userId, 'member_joined', {
    targetType: 'member',
    targetId: auth.userId,
    details: { inviteId: invite.id },
  });

  return json({
    success: true,
    householdId: invite.householdId,
    message: 'Successfully joined household.',
  });
};
