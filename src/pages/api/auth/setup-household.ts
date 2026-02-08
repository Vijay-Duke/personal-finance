import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { households, users, categories, defaultCategories, householdInvites, inviteUsages } from '@/lib/db/schema';
import { eq, and, gt, isNull, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { json, error, unauthorized, forbidden } from '@/lib/api/response';
import { getAppSettings, updateAppSettings, isFirstRun } from '@/lib/config/app-settings';
import { appConfig } from '@/lib/config';
import { logActivity } from '@/lib/audit';

/**
 * POST /api/auth/setup-household
 * Creates or joins a household for a newly signed-up user.
 *
 * Flows:
 * 1. User already has a household → return existing
 * 2. First run → assign super_admin, mark setup complete, disable registration in self-hosted
 * 3. Invite code provided → validate, join existing household, record usage
 * 4. Otherwise → check limits, create new household
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
      message: 'User already has a household',
    });
  }

  try {
    const body = await context.request.json().catch(() => ({}));
    const householdName = body.householdName || `${session.user.name || 'My'}'s Household`;
    const inviteCode = body.inviteCode as string | undefined;

    // Flow 2: First run — make this user the super_admin
    const firstRun = await isFirstRun();
    if (firstRun) {
      const householdId = crypto.randomUUID();
      await db.insert(households).values({
        id: householdId,
        name: householdName,
        primaryCurrency: 'AUD',
      });

      await seedDefaultCategories(householdId);

      // Set user as super_admin + owner of their household
      await db
        .update(users)
        .set({
          householdId,
          role: 'super_admin',
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      // Mark setup as completed
      const settingsUpdate: Parameters<typeof updateAppSettings>[0] = {
        setupCompleted: true,
      };

      // In self-hosted mode, disable registration after first user
      if (appConfig.isSelfHosted) {
        settingsUpdate.registrationEnabled = false;
      }

      await updateAppSettings(settingsUpdate);

      await logActivity(householdId, session.user.id, 'member_joined', {
        targetType: 'member',
        targetId: session.user.id,
        details: { method: 'first_run' },
      });

      return json({
        success: true,
        householdId,
        role: 'super_admin',
        message: 'Instance setup completed. You are the super admin.',
      });
    }

    // Flow 3: Invite code — join existing household
    if (inviteCode) {
      return await handleInviteCodeRedemption(inviteCode, session.user.id);
    }

    // Flow 4: Create new household (check limits)
    const settings = await getAppSettings();
    if (settings.maxHouseholds > 0) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(households);

      if (count >= settings.maxHouseholds) {
        return forbidden('Maximum number of households reached. Contact an administrator for an invite code.');
      }
    }

    const householdId = crypto.randomUUID();
    await db.insert(households).values({
      id: householdId,
      name: householdName,
      primaryCurrency: 'AUD',
    });

    await seedDefaultCategories(householdId);

    await db
      .update(users)
      .set({
        householdId,
        role: 'owner',
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    await logActivity(householdId, session.user.id, 'member_joined', {
      targetType: 'member',
      targetId: session.user.id,
      details: { method: 'created_household' },
    });

    return json({
      success: true,
      householdId,
      message: 'Household created successfully',
    });
  } catch (err) {
    console.error('Error creating household:', err);
    return error('Failed to create household', 500);
  }
};

/**
 * Handle invite code redemption: validate, join household, record usage.
 */
async function handleInviteCodeRedemption(code: string, userId: string): Promise<Response> {
  const normalizedCode = code.toUpperCase().trim();

  const [invite] = await db
    .select()
    .from(householdInvites)
    .where(
      and(
        eq(householdInvites.code, normalizedCode),
        isNull(householdInvites.revokedAt)
      )
    )
    .limit(1);

  if (!invite) {
    return error('Invalid invite code.', 400);
  }

  // Check expiration
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return error('This invite code has expired.', 400);
  }

  // Check usage limit
  if (invite.useCount >= invite.maxUses) {
    return error('This invite code has reached its maximum uses.', 400);
  }

  // Check household member limit
  const settings = await getAppSettings();
  if (settings.maxUsersPerHousehold > 0) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.householdId, invite.householdId));

    if (count >= settings.maxUsersPerHousehold) {
      return error('This household has reached its maximum member limit.', 400);
    }
  }

  // Join the household
  await db
    .update(users)
    .set({
      householdId: invite.householdId,
      role: invite.assignedRole as 'owner' | 'member',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Increment usage count
  await db
    .update(householdInvites)
    .set({ useCount: invite.useCount + 1 })
    .where(eq(householdInvites.id, invite.id));

  // Record audit trail
  await db.insert(inviteUsages).values({
    inviteId: invite.id,
    usedBy: userId,
  });

  await logActivity(invite.householdId, userId, 'member_joined', {
    targetType: 'member',
    targetId: userId,
    details: { method: 'invite_code', inviteCode: normalizedCode },
  });

  return json({
    success: true,
    householdId: invite.householdId,
    message: 'Successfully joined household.',
  });
}

/**
 * Seed default categories for a new household.
 */
async function seedDefaultCategories(householdId: string): Promise<void> {
  const categoryValues = defaultCategories.map((cat, index) => ({
    householdId,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    isSystem: cat.name === 'Uncategorized',
    sortOrder: index + 1,
  }));

  await db.insert(categories).values(categoryValues);
}
