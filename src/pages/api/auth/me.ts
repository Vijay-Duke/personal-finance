import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { json, unauthorized } from '@/lib/api/response';

/**
 * GET /api/auth/me
 * Returns the current user's info including role.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);

  if (!session?.user) {
    return unauthorized('Not authenticated');
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      householdId: users.householdId,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return unauthorized('User not found');
  }

  return json(user);
};
