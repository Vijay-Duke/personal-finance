import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireHouseholdOwner } from '@/lib/auth/guards';
import { json, error, notFound, noContent, forbidden } from '@/lib/api/response';
import { logActivity } from '@/lib/audit';

/**
 * PATCH /api/household/members/:id
 * Update a member's role.
 * Requires owner or super_admin.
 */
export const PATCH: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const roleCheck = requireHouseholdOwner(auth);
  if (roleCheck) return roleCheck;

  const memberId = context.params.id!;

  // Can't change your own role
  if (memberId === auth.userId) {
    return error('You cannot change your own role.', 400);
  }

  const body = await context.request.json().catch(() => ({}));
  const newRole = body.role;

  if (newRole !== 'owner' && newRole !== 'member') {
    return error('Role must be "owner" or "member".', 400);
  }

  // Verify member belongs to same household
  const [member] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, memberId),
        eq(users.householdId, auth.householdId!)
      )
    )
    .limit(1);

  if (!member) {
    return notFound('Member not found in your household.');
  }

  // Can't change a super_admin's role (only super_admins can do that via admin routes)
  if (member.role === 'super_admin') {
    return forbidden('Cannot change a super admin\'s role.');
  }

  await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, memberId));

  await logActivity(auth.householdId!, auth.userId, 'role_changed', {
    targetType: 'member',
    targetId: memberId,
    details: { oldRole: member.role, newRole, memberName: member.name },
  });

  return json({ success: true, memberId, role: newRole });
};

/**
 * DELETE /api/household/members/:id
 * Remove a member from the household.
 * Requires owner or super_admin.
 */
export const DELETE: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const roleCheck = requireHouseholdOwner(auth);
  if (roleCheck) return roleCheck;

  const memberId = context.params.id!;

  // Can't remove yourself
  if (memberId === auth.userId) {
    return error('You cannot remove yourself. Use the leave endpoint instead.', 400);
  }

  // Verify member belongs to same household
  const [member] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, memberId),
        eq(users.householdId, auth.householdId!)
      )
    )
    .limit(1);

  if (!member) {
    return notFound('Member not found in your household.');
  }

  if (member.role === 'super_admin') {
    return forbidden('Cannot remove a super admin.');
  }

  // Remove from household (set householdId to null, role to member)
  await db
    .update(users)
    .set({ householdId: null, role: 'member', updatedAt: new Date() })
    .where(eq(users.id, memberId));

  await logActivity(auth.householdId!, auth.userId, 'member_removed', {
    targetType: 'member',
    targetId: memberId,
    details: { memberName: member.name, memberEmail: member.email },
  });

  return noContent();
};
