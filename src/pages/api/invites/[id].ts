import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { householdInvites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireHouseholdOwner } from '@/lib/auth/guards';
import { json, notFound, noContent } from '@/lib/api/response';
import { logActivity } from '@/lib/audit';

/**
 * DELETE /api/invites/:id
 * Revoke an invite code (soft delete via revokedAt).
 * Requires owner or super_admin.
 */
export const DELETE: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const roleCheck = requireHouseholdOwner(auth);
  if (roleCheck) return roleCheck;

  const inviteId = context.params.id!;

  const [invite] = await db
    .select()
    .from(householdInvites)
    .where(
      and(
        eq(householdInvites.id, inviteId),
        eq(householdInvites.householdId, auth.householdId!)
      )
    )
    .limit(1);

  if (!invite) {
    return notFound('Invite not found.');
  }

  await db
    .update(householdInvites)
    .set({
      revokedAt: new Date(),
      revokedBy: auth.userId,
    })
    .where(eq(householdInvites.id, inviteId));

  await logActivity(auth.householdId!, auth.userId, 'invite_revoked', {
    targetType: 'invite',
    targetId: inviteId,
    details: { code: invite.code },
  });

  return noContent();
};
