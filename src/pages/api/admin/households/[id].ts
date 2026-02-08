import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { households, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { json, notFound, error } from '@/lib/api/response';

/**
 * GET /api/admin/households/:id
 * Get details for a specific household. Super admin only.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const roleCheck = requireSuperAdmin(auth);
  if (roleCheck) return roleCheck;

  const householdId = context.params.id!;

  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  if (!household) {
    return notFound('Household not found.');
  }

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.householdId, householdId));

  return json({ ...household, members });
};

/**
 * PATCH /api/admin/households/:id
 * Update household (enable/disable, change name). Super admin only.
 */
export const PATCH: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const roleCheck = requireSuperAdmin(auth);
  if (roleCheck) return roleCheck;

  const householdId = context.params.id!;

  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  if (!household) {
    return notFound('Household not found.');
  }

  const body = await context.request.json().catch(() => ({}));

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;
  if (typeof body.name === 'string') updates.name = body.name.trim();

  await db
    .update(households)
    .set(updates)
    .where(eq(households.id, householdId));

  const [updated] = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  return json(updated);
};
