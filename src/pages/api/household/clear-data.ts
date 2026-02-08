import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { accounts, transactions, budgets, goals, insurancePolicies, households } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireHouseholdOwner } from '@/lib/auth/guards';
import { json, error } from '@/lib/api/response';
import { logActivity } from '@/lib/audit';

/**
 * POST /api/household/clear-data
 * Clear all financial data for the household. Owner only.
 * Requires confirmation by providing the household name.
 */
export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const roleCheck = requireHouseholdOwner(auth);
  if (roleCheck) return roleCheck;

  const body = await context.request.json().catch(() => ({}));
  const { confirmName } = body;

  if (!confirmName) {
    return error('Household name confirmation is required.', 400);
  }

  // Verify confirmation matches household name
  const [household] = await db
    .select({ name: households.name })
    .from(households)
    .where(eq(households.id, auth.householdId!))
    .limit(1);

  if (!household || household.name !== confirmName) {
    return error('Confirmation name does not match household name.', 400);
  }

  // Delete financial data in dependency order
  // Transactions reference accounts, so delete them first
  await db.delete(transactions).where(eq(transactions.householdId, auth.householdId!));
  await db.delete(goals).where(eq(goals.householdId, auth.householdId!));
  await db.delete(budgets).where(eq(budgets.householdId, auth.householdId!));
  await db.delete(insurancePolicies).where(eq(insurancePolicies.householdId, auth.householdId!));
  await db.delete(accounts).where(eq(accounts.householdId, auth.householdId!));

  await logActivity(auth.householdId!, auth.userId, 'household_updated', {
    targetType: 'household',
    targetId: auth.householdId!,
    details: { action: 'clear_financial_data' },
  });

  return json({ success: true, message: 'All financial data has been cleared.' });
};
