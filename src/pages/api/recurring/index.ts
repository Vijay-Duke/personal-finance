import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { recurringSchedules, accounts, categories } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, created, error, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/recurring
 * List all recurring transaction schedules
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const householdId = session.user.householdId;

  try {
    const schedules = await db
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
        categoryColor: categories.color,
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
      })
      .from(recurringSchedules)
      .leftJoin(accounts, eq(recurringSchedules.accountId, accounts.id))
      .leftJoin(categories, eq(recurringSchedules.categoryId, categories.id))
      .where(eq(recurringSchedules.householdId, householdId))
      .orderBy(desc(recurringSchedules.nextOccurrence));

    return json(schedules);
  } catch (err) {
    console.error('Error fetching recurring schedules:', err);
    return error('Failed to fetch recurring schedules', 500);
  }
};

/**
 * POST /api/recurring
 * Create a new recurring transaction schedule
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const householdId = session.user.householdId;

  try {
    const body = await context.request.json();
    const {
      accountId,
      type,
      amount,
      currency = 'USD',
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
      autoCreate = false,
    } = body;

    // Validate required fields
    if (!accountId || !type || !amount || !frequency || !startDate) {
      return error('Missing required fields');
    }

    // Validate account belongs to household
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.householdId, householdId)));

    if (!account) {
      return error('Account not found');
    }

    // Calculate next occurrence
    const nextOccurrence = calculateNextOccurrence({
      frequency,
      dayOfWeek,
      dayOfMonth,
      month,
      startDate: new Date(startDate),
    });

    const [schedule] = await db
      .insert(recurringSchedules)
      .values({
        householdId,
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
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextOccurrence,
        autoCreate,
      })
      .returning();

    return created(schedule);
  } catch (err) {
    console.error('Error creating recurring schedule:', err);
    return error('Failed to create recurring schedule', 500);
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

  // If start date is in the future, use it
  if (next > now) {
    return next;
  }

  // Calculate based on frequency
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
      const targetMonth = (month ?? 1) - 1; // Convert to 0-indexed
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
