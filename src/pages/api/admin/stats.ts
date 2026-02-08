import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { households, users, accounts } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { json } from '@/lib/api/response';

/**
 * GET /api/admin/stats
 * Instance-level statistics. Super admin only.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const roleCheck = requireSuperAdmin(auth);
  if (roleCheck) return roleCheck;

  const [householdCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(households);

  const [userCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  const [accountCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(accounts);

  return json({
    households: householdCount.count,
    users: userCount.count,
    accounts: accountCount.count,
  });
};
