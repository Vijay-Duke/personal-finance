import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { households } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireHouseholdOwner } from '@/lib/auth/guards';
import { json, error, notFound } from '@/lib/api/response';
import { logActivity } from '@/lib/audit';

/**
 * GET /api/household
 * Get current user's household details.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, auth.householdId!))
    .limit(1);

  if (!household) {
    return notFound('Household not found.');
  }

  return json(household);
};

/**
 * PATCH /api/household
 * Update household details (name, currency, timezone).
 * Requires owner or super_admin.
 */
export const PATCH: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const roleCheck = requireHouseholdOwner(auth);
  if (roleCheck) return roleCheck;

  const body = await context.request.json().catch(() => ({}));

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name && typeof body.name === 'string') updates.name = body.name.trim();
  if (body.primaryCurrency && typeof body.primaryCurrency === 'string') updates.primaryCurrency = body.primaryCurrency;
  if (body.timezone && typeof body.timezone === 'string') updates.timezone = body.timezone;
  if (typeof body.financialYearStart === 'number' && body.financialYearStart >= 1 && body.financialYearStart <= 12) {
    updates.financialYearStart = body.financialYearStart;
  }

  await db
    .update(households)
    .set(updates)
    .where(eq(households.id, auth.householdId!));

  const [updated] = await db
    .select()
    .from(households)
    .where(eq(households.id, auth.householdId!))
    .limit(1);

  await logActivity(auth.householdId!, auth.userId, 'household_updated', {
    targetType: 'household',
    targetId: auth.householdId!,
    details: { fields: Object.keys(updates).filter((k) => k !== 'updatedAt') },
  });

  return json(updated);
};
