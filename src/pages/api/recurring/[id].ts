import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { recurringSchedules, accounts, categories } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized, notFound } from '../../../lib/api/response';

/**
 * GET /api/recurring/:id
 * Get a single recurring schedule
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) return error('Schedule ID required');

  const householdId = session.user.householdId;

  try {
    const [schedule] = await db
      .select({
        id: recurringSchedules.id,
        accountId: recurringSchedules.accountId,
        accountName: accounts.name,
        type: recurringSchedules.type,
        amount: recurringSchedules.amount,
        currency: recurringSchedules.currency,
        description: recurringSchedules.description,
        merchant: recurringSchedules.merchant,
        categoryId: recurringSchedules.categoryId,
        categoryName: categories.name,
        transferAccountId: recurringSchedules.transferAccountId,
        frequency: recurringSchedules.frequency,
        dayOfWeek: recurringSchedules.dayOfWeek,
        dayOfMonth: recurringSchedules.dayOfMonth,
        month: recurringSchedules.month,
        startDate: recurringSchedules.startDate,
        endDate: recurringSchedules.endDate,
        nextOccurrence: recurringSchedules.nextOccurrence,
        isActive: recurringSchedules.isActive,
        autoCreate: recurringSchedules.autoCreate,
        occurrenceCount: recurringSchedules.occurrenceCount,
        lastOccurrence: recurringSchedules.lastOccurrence,
        createdAt: recurringSchedules.createdAt,
        updatedAt: recurringSchedules.updatedAt,
      })
      .from(recurringSchedules)
      .leftJoin(accounts, eq(recurringSchedules.accountId, accounts.id))
      .leftJoin(categories, eq(recurringSchedules.categoryId, categories.id))
      .where(
        and(
          eq(recurringSchedules.id, id),
          eq(recurringSchedules.householdId, householdId)
        )
      );

    if (!schedule) {
      return notFound('Recurring schedule not found');
    }

    return json(schedule);
  } catch (err) {
    console.error('Error fetching recurring schedule:', err);
    return error('Failed to fetch recurring schedule', 500);
  }
};

/**
 * PATCH /api/recurring/:id
 * Update a recurring schedule
 */
export const PATCH: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) return error('Schedule ID required');

  const householdId = session.user.householdId;

  try {
    const body = await context.request.json();
    const {
      accountId,
      type,
      amount,
      currency,
      description,
      merchant,
      categoryId,
      transferAccountId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      month,
      startDate,
      endDate,
      isActive,
      autoCreate,
    } = body;

    // Verify schedule exists and belongs to household
    const [existing] = await db
      .select({ id: recurringSchedules.id })
      .from(recurringSchedules)
      .where(
        and(
          eq(recurringSchedules.id, id),
          eq(recurringSchedules.householdId, householdId)
        )
      );

    if (!existing) {
      return notFound('Recurring schedule not found');
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (accountId !== undefined) updates.accountId = accountId;
    if (type !== undefined) updates.type = type;
    if (amount !== undefined) updates.amount = amount;
    if (currency !== undefined) updates.currency = currency;
    if (description !== undefined) updates.description = description;
    if (merchant !== undefined) updates.merchant = merchant;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (transferAccountId !== undefined) updates.transferAccountId = transferAccountId;
    if (frequency !== undefined) updates.frequency = frequency;
    if (dayOfWeek !== undefined) updates.dayOfWeek = dayOfWeek;
    if (dayOfMonth !== undefined) updates.dayOfMonth = dayOfMonth;
    if (month !== undefined) updates.month = month;
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updates.isActive = isActive;
    if (autoCreate !== undefined) updates.autoCreate = autoCreate;

    // Recalculate next occurrence if schedule parameters changed
    if (frequency !== undefined || startDate !== undefined) {
      updates.nextOccurrence = calculateNextOccurrence({
        frequency: frequency || 'monthly',
        dayOfWeek,
        dayOfMonth,
        month,
        startDate: startDate ? new Date(startDate) : new Date(),
      });
    }

    const [updated] = await db
      .update(recurringSchedules)
      .set(updates)
      .where(eq(recurringSchedules.id, id))
      .returning();

    return json(updated);
  } catch (err) {
    console.error('Error updating recurring schedule:', err);
    return error('Failed to update recurring schedule', 500);
  }
};

/**
 * DELETE /api/recurring/:id
 * Delete a recurring schedule
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) return error('Schedule ID required');

  const householdId = session.user.householdId;

  try {
    // Verify schedule exists and belongs to household
    const [existing] = await db
      .select({ id: recurringSchedules.id })
      .from(recurringSchedules)
      .where(
        and(
          eq(recurringSchedules.id, id),
          eq(recurringSchedules.householdId, householdId)
        )
      );

    if (!existing) {
      return notFound('Recurring schedule not found');
    }

    await db.delete(recurringSchedules).where(eq(recurringSchedules.id, id));

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting recurring schedule:', err);
    return error('Failed to delete recurring schedule', 500);
  }
};

/**
 * Calculate the next occurrence date for a recurring schedule
 */
function calculateNextOccurrence(params: {
  frequency: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  month?: number | null;
  startDate: Date;
}): Date {
  const { frequency, dayOfWeek, dayOfMonth, month, startDate } = params;
  const now = new Date();
  let next = new Date(startDate);

  if (next > now) {
    return next;
  }

  switch (frequency) {
    case 'daily':
      next = new Date(now);
      next.setDate(next.getDate() + 1);
      break;

    case 'weekly':
      next = new Date(now);
      const targetDay = dayOfWeek ?? 0;
      const currentDay = next.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilTarget);
      break;

    case 'biweekly':
      next = new Date(now);
      next.setDate(next.getDate() + 14);
      break;

    case 'monthly':
      next = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth ?? 1);
      break;

    case 'quarterly':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const nextQuarterMonth = ((currentQuarter + 1) % 4) * 3;
      const nextQuarterYear = currentQuarter === 3 ? now.getFullYear() + 1 : now.getFullYear();
      next = new Date(nextQuarterYear, nextQuarterMonth, dayOfMonth ?? 1);
      break;

    case 'yearly':
      const targetMonth = (month ?? 1) - 1;
      next = new Date(now.getFullYear() + 1, targetMonth, dayOfMonth ?? 1);
      if (now.getMonth() < targetMonth ||
          (now.getMonth() === targetMonth && now.getDate() < (dayOfMonth ?? 1))) {
        next = new Date(now.getFullYear(), targetMonth, dayOfMonth ?? 1);
      }
      break;

    default:
      next = new Date(now);
      next.setMonth(next.getMonth() + 1);
  }

  return next;
}
