import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { goals, goalContributions } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, noContent, unauthorized, notFound } from '../../../lib/api/response';

export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Goal ID is required');
  }

  try {
    const [goal] = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.id, id),
          eq(goals.householdId, session.user.householdId)
        )
      );

    if (!goal) {
      return notFound('Goal not found');
    }

    // Get recent contributions
    const contributions = await db
      .select()
      .from(goalContributions)
      .where(eq(goalContributions.goalId, id))
      .orderBy(desc(goalContributions.date))
      .limit(10);

    return json({
      ...goal,
      progress: goal.targetAmount > 0
        ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
        : 0,
      remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
      recentContributions: contributions,
    });
  } catch (err) {
    console.error('Error fetching goal:', err);
    return error('Failed to fetch goal', 500);
  }
};

export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Goal ID is required');
  }

  try {
    const body = await context.request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.targetAmount !== undefined) updateData.targetAmount = body.targetAmount;
    if (body.currentAmount !== undefined) updateData.currentAmount = body.currentAmount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.targetDate !== undefined) updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    if (body.completedDate !== undefined) updateData.completedDate = body.completedDate ? new Date(body.completedDate) : null;
    if (body.linkedAccountIds !== undefined) updateData.linkedAccountIds = body.linkedAccountIds ? JSON.stringify(body.linkedAccountIds) : null;
    if (body.monthlyContribution !== undefined) updateData.monthlyContribution = body.monthlyContribution;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;

    // Auto-complete if target reached
    if (body.status === 'completed' || (body.currentAmount !== undefined && body.currentAmount >= (body.targetAmount || 0))) {
      updateData.status = 'completed';
      updateData.completedDate = new Date();
    }

    const [result] = await db
      .update(goals)
      .set(updateData)
      .where(
        and(
          eq(goals.id, id),
          eq(goals.householdId, session.user.householdId)
        )
      )
      .returning();

    if (!result) {
      return notFound('Goal not found');
    }

    return json({
      ...result,
      progress: result.targetAmount > 0
        ? Math.min(100, (result.currentAmount / result.targetAmount) * 100)
        : 0,
      remaining: Math.max(0, result.targetAmount - result.currentAmount),
    });
  } catch (err) {
    console.error('Error updating goal:', err);
    return error('Failed to update goal', 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Goal ID is required');
  }

  try {
    await db
      .delete(goals)
      .where(
        and(
          eq(goals.id, id),
          eq(goals.householdId, session.user.householdId)
        )
      );

    return noContent();
  } catch (err) {
    console.error('Error deleting goal:', err);
    return error('Failed to delete goal', 500);
  }
};

/**
 * POST /api/goals/:id
 * Add a contribution to a goal.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Goal ID is required');
  }

  try {
    const body = await context.request.json();

    if (!body.amount || body.amount <= 0) {
      return error('Contribution amount must be positive');
    }

    // Verify goal belongs to household
    const [goal] = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.id, id),
          eq(goals.householdId, session.user.householdId)
        )
      );

    if (!goal) {
      return notFound('Goal not found');
    }

    // Create contribution
    const [contribution] = await db.insert(goalContributions).values({
      goalId: id,
      amount: body.amount,
      date: body.date ? new Date(body.date) : new Date(),
      accountId: body.accountId,
      transactionId: body.transactionId,
      notes: body.notes?.trim(),
    }).returning();

    // Update goal current amount
    const newCurrentAmount = goal.currentAmount + body.amount;
    const updateData: Record<string, unknown> = {
      currentAmount: newCurrentAmount,
      updatedAt: new Date(),
    };

    // Auto-complete if target reached
    if (newCurrentAmount >= goal.targetAmount) {
      updateData.status = 'completed';
      updateData.completedDate = new Date();
    }

    const [updatedGoal] = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, id))
      .returning();

    return json({
      contribution,
      goal: {
        ...updatedGoal,
        progress: updatedGoal.targetAmount > 0
          ? Math.min(100, (updatedGoal.currentAmount / updatedGoal.targetAmount) * 100)
          : 0,
        remaining: Math.max(0, updatedGoal.targetAmount - updatedGoal.currentAmount),
      },
    });
  } catch (err) {
    console.error('Error adding contribution:', err);
    return error('Failed to add contribution', 500);
  }
};
