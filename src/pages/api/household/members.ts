import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { json } from '@/lib/api/response';

/**
 * GET /api/household/members
 * List members of the current household.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context);
  if (isAuthError(auth)) return auth;

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.householdId, auth.householdId!));

  return json(members);
};
