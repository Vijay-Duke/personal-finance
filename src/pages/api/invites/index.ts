import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { householdInvites } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireHouseholdOwner } from '@/lib/auth/guards';
import { json, error, created } from '@/lib/api/response';
import { generateInviteCode } from '@/lib/auth/invite-codes';
import { logActivity } from '@/lib/audit';

/**
 * GET /api/invites
 * List invite codes for the current household.
 * Requires owner or super_admin.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const roleCheck = requireHouseholdOwner(auth);
  if (roleCheck) return roleCheck;

  const invites = await db
    .select()
    .from(householdInvites)
    .where(eq(householdInvites.householdId, auth.householdId!));

  return json(invites);
};

/**
 * POST /api/invites
 * Create a new invite code.
 * Requires owner or super_admin.
 */
export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const roleCheck = requireHouseholdOwner(auth);
  if (roleCheck) return roleCheck;

  const body = await context.request.json().catch(() => ({}));

  const maxUses = Math.max(1, Math.min(body.maxUses ?? 1, 100));
  const assignedRole = body.assignedRole === 'owner' ? 'owner' : 'member';

  // Parse optional expiration (hours from now)
  let expiresAt: Date | null = null;
  if (body.expiresInHours && body.expiresInHours > 0) {
    expiresAt = new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000);
  }

  const code = generateInviteCode();

  const [invite] = await db
    .insert(householdInvites)
    .values({
      householdId: auth.householdId!,
      code,
      createdBy: auth.userId,
      assignedRole,
      maxUses,
      expiresAt,
    })
    .returning();

  await logActivity(auth.householdId!, auth.userId, 'invite_created', {
    targetType: 'invite',
    targetId: invite.id,
    details: { assignedRole, maxUses },
  });

  return created(invite);
};
