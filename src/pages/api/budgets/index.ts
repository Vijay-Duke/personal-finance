import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { budgets, categories, type NewBudget } from '../../../lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/budgets
 * List all budgets for the current household.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const period = url.searchParams.get('period'); // Filter by period (monthly, quarterly, yearly)
  const periodStart = url.searchParams.get('periodStart'); // Filter by specific period start

  try {
    const conditions = [eq(budgets.householdId, session.user.householdId)];

    if (period) {
      conditions.push(eq(budgets.period, period as any));
    }
    if (periodStart) {
      conditions.push(eq(budgets.periodStart, periodStart));
    }

    const results = await db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        amount: budgets.amount,
        currency: budgets.currency,
        period: budgets.period,
        periodStart: budgets.periodStart,
        rolloverEnabled: budgets.rolloverEnabled,
        rolloverAmount: budgets.rolloverAmount,
        alertThreshold: budgets.alertThreshold,
        alertEnabled: budgets.alertEnabled,
        notes: budgets.notes,
        isActive: budgets.isActive,
        createdAt: budgets.createdAt,
        updatedAt: budgets.updatedAt,
        // Joined category info
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        categoryType: categories.type,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(asc(categories.name));

    return json(results);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    return error('Failed to fetch budgets', 500);
  }
};

/**
 * POST /api/budgets
 * Create a new budget.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    if (!body.categoryId) {
      return error('Category is required');
    }
    if (body.amount === undefined || body.amount === null || body.amount <= 0) {
      return error('Amount must be a positive number');
    }

    // Verify category belongs to household
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, body.categoryId));

    if (!category || category.householdId !== session.user.householdId) {
      return error('Category not found', 404);
    }

    const newBudget: NewBudget = {
      householdId: session.user.householdId,
      categoryId: body.categoryId,
      amount: body.amount,
      currency: body.currency || 'USD',
      period: body.period || 'monthly',
      periodStart: body.periodStart,
      rolloverEnabled: body.rolloverEnabled ?? false,
      rolloverAmount: body.rolloverAmount || 0,
      alertThreshold: body.alertThreshold ?? 80,
      alertEnabled: body.alertEnabled ?? true,
      notes: body.notes?.trim(),
      isActive: body.isActive ?? true,
    };

    const [result] = await db.insert(budgets).values(newBudget).returning();

    return created(result);
  } catch (err) {
    console.error('Error creating budget:', err);
    return error('Failed to create budget', 500);
  }
};
