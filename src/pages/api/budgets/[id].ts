import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { budgets, categories } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, noContent, unauthorized, notFound } from '../../../lib/api/response';

export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Budget ID is required');
  }

  try {
    const [budget] = await db
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
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(
        and(
          eq(budgets.id, id),
          eq(budgets.householdId, session.user.householdId)
        )
      );

    if (!budget) {
      return notFound('Budget not found');
    }

    return json(budget);
  } catch (err) {
    console.error('Error fetching budget:', err);
    return error('Failed to fetch budget', 500);
  }
};

export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Budget ID is required');
  }

  try {
    const body = await context.request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.period !== undefined) updateData.period = body.period;
    if (body.periodStart !== undefined) updateData.periodStart = body.periodStart;
    if (body.rolloverEnabled !== undefined) updateData.rolloverEnabled = body.rolloverEnabled;
    if (body.rolloverAmount !== undefined) updateData.rolloverAmount = body.rolloverAmount;
    if (body.alertThreshold !== undefined) updateData.alertThreshold = body.alertThreshold;
    if (body.alertEnabled !== undefined) updateData.alertEnabled = body.alertEnabled;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [result] = await db
      .update(budgets)
      .set(updateData)
      .where(
        and(
          eq(budgets.id, id),
          eq(budgets.householdId, session.user.householdId)
        )
      )
      .returning();

    if (!result) {
      return notFound('Budget not found');
    }

    return json(result);
  } catch (err) {
    console.error('Error updating budget:', err);
    return error('Failed to update budget', 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Budget ID is required');
  }

  try {
    await db
      .delete(budgets)
      .where(
        and(
          eq(budgets.id, id),
          eq(budgets.householdId, session.user.householdId)
        )
      );

    return noContent();
  } catch (err) {
    console.error('Error deleting budget:', err);
    return error('Failed to delete budget', 500);
  }
};
