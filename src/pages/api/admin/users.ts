import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { users, households } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { json } from '@/lib/api/response';

/**
 * GET /api/admin/users
 * List all users with household names. Super admin only.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const roleCheck = requireSuperAdmin(auth);
  if (roleCheck) return roleCheck;

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      householdId: users.householdId,
      createdAt: users.createdAt,
    })
    .from(users);

  return json(allUsers);
};
