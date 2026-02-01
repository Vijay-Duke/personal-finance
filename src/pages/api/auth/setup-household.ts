import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { households, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { json, error, unauthorized } from '@/lib/api/response';

/**
 * POST /api/auth/setup-household
 * Creates a household for a newly signed-up user who doesn't have one.
 * This should be called immediately after signup.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);

  if (!session?.user) {
    return unauthorized('Not authenticated');
  }

  // Check if user already has a household
  if (session.user.householdId) {
    return json({
      success: true,
      householdId: session.user.householdId,
      message: 'User already has a household'
    });
  }

  try {
    const body = await context.request.json().catch(() => ({}));
    const householdName = body.householdName || `${session.user.name || 'My'}'s Household`;

    // Create a new household
    const householdId = crypto.randomUUID();
    await db.insert(households).values({
      id: householdId,
      name: householdName,
      primaryCurrency: 'AUD', // Default for Australian users
    });

    // Update the user with the household ID and set them as owner
    await db
      .update(users)
      .set({
        householdId,
        role: 'owner',
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return json({
      success: true,
      householdId,
      message: 'Household created successfully'
    });
  } catch (err) {
    console.error('Error creating household:', err);
    return error('Failed to create household', 500);
  }
};
