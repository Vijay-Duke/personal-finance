import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { goals, type NewGoal } from '../../../lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/goals
 * List all goals for the current household.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const status = url.searchParams.get('status'); // Filter by status
  const type = url.searchParams.get('type'); // Filter by type

  try {
    const conditions = [eq(goals.householdId, session.user.householdId)];

    if (status) {
      conditions.push(eq(goals.status, status as any));
    }
    if (type) {
      conditions.push(eq(goals.type, type as any));
    }

    const results = await db
      .select()
      .from(goals)
      .where(and(...conditions))
      .orderBy(asc(goals.priority), desc(goals.createdAt));

    // Calculate progress for each goal
    const goalsWithProgress = results.map(goal => ({
      ...goal,
      progress: goal.targetAmount > 0
        ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
        : 0,
      remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
    }));

    return json(goalsWithProgress);
  } catch (err) {
    console.error('Error fetching goals:', err);
    return error('Failed to fetch goals', 500);
  }
};

/**
 * POST /api/goals
 * Create a new goal.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    if (!body.name?.trim()) {
      return error('Goal name is required');
    }
    if (body.targetAmount === undefined || body.targetAmount === null || body.targetAmount <= 0) {
      return error('Target amount must be a positive number');
    }

    const newGoal: NewGoal = {
      householdId: session.user.householdId,
      name: body.name.trim(),
      description: body.description?.trim(),
      type: body.type || 'savings',
      status: body.status || 'active',
      targetAmount: body.targetAmount,
      currentAmount: body.currentAmount || 0,
      currency: body.currency || 'USD',
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
      linkedAccountIds: body.linkedAccountIds ? JSON.stringify(body.linkedAccountIds) : undefined,
      monthlyContribution: body.monthlyContribution,
      priority: body.priority ?? 5,
      icon: body.icon,
      color: body.color,
    };

    const [result] = await db.insert(goals).values(newGoal).returning();

    return created({
      ...result,
      progress: result.targetAmount > 0
        ? Math.min(100, (result.currentAmount / result.targetAmount) * 100)
        : 0,
      remaining: Math.max(0, result.targetAmount - result.currentAmount),
    });
  } catch (err) {
    console.error('Error creating goal:', err);
    return error('Failed to create goal', 500);
  }
};
