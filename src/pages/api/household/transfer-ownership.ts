import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireHouseholdOwner } from '@/lib/auth/guards';
import { json, error, notFound } from '@/lib/api/response';
import { logActivity } from '@/lib/audit';

/**
 * POST /api/household/transfer-ownership
 * Transfer household ownership to another member.
 * Current owner becomes a member; target member becomes owner.
 */
export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const roleCheck = requireHouseholdOwner(auth);
  if (roleCheck) return roleCheck;

  const body = await context.request.json().catch(() => ({}));
  const { newOwnerId } = body;

  if (!newOwnerId || typeof newOwnerId !== 'string') {
    return error('newOwnerId is required.', 400);
  }

  if (newOwnerId === auth.userId) {
    return error('You cannot transfer ownership to yourself.', 400);
  }

  // Verify target is in the same household
  const [target] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, newOwnerId),
        eq(users.householdId, auth.householdId!)
      )
    )
    .limit(1);

  if (!target) {
    return notFound('Member not found in your household.');
  }

  if (target.role === 'super_admin') {
    return error('Cannot transfer ownership to a super admin.', 400);
  }

  // Demote current owner to member
  await db
    .update(users)
    .set({ role: 'member', updatedAt: new Date() })
    .where(eq(users.id, auth.userId));

  // Promote target to owner
  await db
    .update(users)
    .set({ role: 'owner', updatedAt: new Date() })
    .where(eq(users.id, newOwnerId));

  await logActivity(auth.householdId!, auth.userId, 'ownership_transferred', {
    targetType: 'member',
    targetId: newOwnerId,
    details: { fromUserId: auth.userId, toUserId: newOwnerId, toUserName: target.name },
  });

  return json({ success: true, newOwnerId });
};
