import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { households, users } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { json } from '@/lib/api/response';

/**
 * GET /api/admin/households
 * List all households with member counts. Super admin only.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const roleCheck = requireSuperAdmin(auth);
  if (roleCheck) return roleCheck;

  const allHouseholds = await db
    .select({
      id: households.id,
      name: households.name,
      primaryCurrency: households.primaryCurrency,
      isActive: households.isActive,
      createdAt: households.createdAt,
      memberCount: sql<number>`(SELECT count(*) FROM users WHERE users.household_id = ${households.id})`,
    })
    .from(households);

  return json(allHouseholds);
};
