import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  notifications,
  recurringSchedules,
  goals,
  budgets,
  insurancePolicies,
  transactions,
  categories,
  households,
  users,
} from '../../../lib/db/schema';
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { json, error, unauthorized } from '../../../lib/api/response';
import { getSession } from '../../../lib/auth/session';

/**
 * POST /api/jobs/generate-notifications
 *
 * Generate notifications for various events:
 * - Bill reminders (from recurring transactions due soon)
 * - Goal milestones (25%, 50%, 75%, 100%)
 * - Budget alerts (80%, 100% spent)
 * - Insurance renewal reminders (30, 7, 1 days before)
 *
 * Query params:
 * - householdId: Optional - process only this household
 * - types: Optional comma-separated list of notification types to generate
 * - secret: Optional API secret for system calls (set JOBS_API_SECRET env var)
 */
export const POST: APIRoute = async (context) => {
  // Check authentication
  const session = await getSession(context);
  const url = new URL(context.request.url);
  const providedSecret = url.searchParams.get('secret');
  const expectedSecret = import.meta.env.JOBS_API_SECRET;

  const isAuthenticated = !!session?.user?.id;
  const hasValidSecret = expectedSecret && providedSecret === expectedSecret;

  if (!isAuthenticated && !hasValidSecret) {
    return unauthorized('Authentication required');
  }

  const specificHouseholdId = url.searchParams.get('householdId');
  const typesParam = url.searchParams.get('types');
  const typesToGenerate = typesParam
    ? typesParam.split(',').map((t) => t.trim())
    : ['bill_reminder', 'goal_milestone', 'budget_alert', 'insurance_renewal'];

  try {
    // Get households to process
    const targetHouseholds = specificHouseholdId
      ? await db
          .select({ id: households.id })
          .from(households)
          .where(eq(households.id, specificHouseholdId))
      : await db.select({ id: households.id }).from(households);

    if (targetHouseholds.length === 0) {
      return error('No households found', 404);
    }

    const results: {
      householdId: string;
      generated: number;
      byType: Record<string, number>;
    }[] = [];

    const errors: string[] = [];

    // Process each household
    for (const household of targetHouseholds) {
      try {
        const householdResults: Record<string, number> = {
          bill_reminder: 0,
          goal_milestone: 0,
          budget_alert: 0,
          insurance_renewal: 0,
        };

        // Get users in this household
        const householdUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.householdId, household.id));

        if (householdUsers.length === 0) continue;

        // Generate bill reminders
        if (typesToGenerate.includes('bill_reminder')) {
          const count = await generateBillReminders(
            household.id,
            householdUsers.map((u) => u.id)
          );
          householdResults.bill_reminder = count;
        }

        // Generate goal milestones
        if (typesToGenerate.includes('goal_milestone')) {
          const count = await generateGoalMilestones(
            household.id,
            householdUsers.map((u) => u.id)
          );
          householdResults.goal_milestone = count;
        }

        // Generate budget alerts
        if (typesToGenerate.includes('budget_alert')) {
          const count = await generateBudgetAlerts(
            household.id,
            householdUsers.map((u) => u.id)
          );
          householdResults.budget_alert = count;
        }

        // Generate insurance renewal reminders
        if (typesToGenerate.includes('insurance_renewal')) {
          const count = await generateInsuranceRenewals(
            household.id,
            householdUsers.map((u) => u.id)
          );
          householdResults.insurance_renewal = count;
        }

        const totalGenerated = Object.values(householdResults).reduce(
          (a, b) => a + b,
          0
        );

        results.push({
          householdId: household.id,
          generated: totalGenerated,
          byType: householdResults,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Household ${household.id}: ${message}`);
      }
    }

    const totalGenerated = results.reduce((sum, r) => sum + r.generated, 0);

    return json({
      success: true,
      householdsProcessed: results.length,
      totalGenerated,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error generating notifications:', err);
    return error('Failed to generate notifications', 500);
  }
};

/**
 * Generate bill reminders from recurring schedules
 */
async function generateBillReminders(
  householdId: string,
  userIds: string[]
): Promise<number> {
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  // Get active recurring schedules with next occurrence within 3 days
  const upcomingBills = await db.query.recurringSchedules.findMany({
    where: and(
      eq(recurringSchedules.householdId, householdId),
      eq(recurringSchedules.isActive, true),
      gte(recurringSchedules.nextOccurrence, now),
      lte(recurringSchedules.nextOccurrence, threeDaysFromNow)
    ),
    with: {
      account: true,
    },
  });

  let generated = 0;

  for (const bill of upcomingBills) {
    // Check if notification already exists for this bill occurrence
    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        inArray(notifications.userId, userIds),
        eq(notifications.type, 'transaction_alert'),
        eq(notifications.resourceType, 'recurring_schedule'),
        eq(notifications.resourceId, bill.id),
        sql`${notifications.createdAt} > datetime('now', '-1 day')`
      ),
    });

    if (existingNotification) continue;

    const daysUntil = bill.nextOccurrence
      ? Math.ceil(
          (bill.nextOccurrence.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const daysText = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

    // Create notification for each user
    for (const userId of userIds) {
      await db.insert(notifications).values({
        userId,
        title: `Bill Due ${daysText}`,
        message: `${bill.description || 'Recurring payment'} of $${bill.amount.toFixed(2)} is due ${daysText}.`,
        type: 'transaction_alert',
        priority: daysUntil <= 1 ? 'high' : 'normal',
        link: '/cashflow',
        resourceType: 'recurring_schedule',
        resourceId: bill.id,
      });
      generated++;
    }
  }

  return generated;
}

/**
 * Generate goal milestone notifications
 */
async function generateGoalMilestones(
  householdId: string,
  userIds: string[]
): Promise<number> {
  // Get active goals
  const activeGoals = await db.query.goals.findMany({
    where: and(
      eq(goals.householdId, householdId),
      eq(goals.status, 'active')
    ),
  });

  let generated = 0;
  const milestones = [25, 50, 75, 100];

  for (const goal of activeGoals) {
    const progressPercent = (goal.currentAmount / goal.targetAmount) * 100;

    // Find the highest milestone reached
    let reachedMilestone: number | null = null;
    for (const milestone of milestones) {
      if (progressPercent >= milestone) {
        reachedMilestone = milestone;
      }
    }

    if (!reachedMilestone) continue;

    // Check if we've already notified for this milestone
    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        inArray(notifications.userId, userIds),
        eq(notifications.type, 'goal_milestone'),
        eq(notifications.resourceType, 'goal'),
        eq(notifications.resourceId, goal.id),
        sql`${notifications.metadata} LIKE ${`%"milestone":${reachedMilestone}%`}`
      ),
    });

    if (existingNotification) continue;

    // Create milestone notification
    const milestoneText =
      reachedMilestone === 100 ? 'completed' : `${reachedMilestone}% reached`;

    for (const userId of userIds) {
      await db.insert(notifications).values({
        userId,
        title: `Goal ${milestoneText}!`,
        message:
          reachedMilestone === 100
            ? `Congratulations! You've reached your goal "${goal.name}"!`
            : `Great progress! Your goal "${goal.name}" is ${reachedMilestone}% complete.`,
        type: 'goal_milestone',
        priority: reachedMilestone === 100 ? 'high' : 'normal',
        link: '/goals',
        resourceType: 'goal',
        resourceId: goal.id,
        metadata: JSON.stringify({
          milestone: reachedMilestone,
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
        }),
      });
      generated++;
    }
  }

  return generated;
}

/**
 * Generate budget alerts
 */
async function generateBudgetAlerts(
  householdId: string,
  userIds: string[]
): Promise<number> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get month start and end
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Get active budgets
  const activeBudgets = await db.query.budgets.findMany({
    where: and(
      eq(budgets.householdId, householdId),
      eq(budgets.isActive, true),
      eq(budgets.alertEnabled, true)
    ),
  });

  let generated = 0;

  for (const budget of activeBudgets) {
    // Calculate spent amount for this category in current month
    const spentResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          eq(transactions.categoryId, budget.categoryId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, monthStart),
          lte(transactions.date, monthEnd)
        )
      );

    const spent = spentResult[0]?.total || 0;
    const percentSpent = (spent / budget.amount) * 100;
    const alertThreshold = budget.alertThreshold || 80;

    // Determine alert level
    let alertLevel: 'warning' | 'critical' | null = null;
    if (percentSpent >= 100) {
      alertLevel = 'critical';
    } else if (percentSpent >= alertThreshold) {
      alertLevel = 'warning';
    }

    if (!alertLevel) continue;

    // Check if we've already sent this alert recently
    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        inArray(notifications.userId, userIds),
        eq(notifications.type, 'budget_warning'),
        eq(notifications.resourceType, 'budget'),
        eq(notifications.resourceId, budget.id),
        sql`${notifications.createdAt} > datetime('now', '-3 days')`,
        sql`${notifications.metadata} LIKE ${`%"level":"${alertLevel}"%`}`
      ),
    });

    if (existingNotification) continue;

    // Fetch category name
    let categoryName = 'Unknown category';
    if (budget.categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, budget.categoryId),
      });
      if (category) {
        categoryName = category.name;
      }
    }

    const remaining = budget.amount - spent;

    for (const userId of userIds) {
      await db.insert(notifications).values({
        userId,
        title: alertLevel === 'critical' ? 'Budget Exceeded!' : 'Budget Warning',
        message:
          alertLevel === 'critical'
            ? `You've exceeded your ${categoryName} budget! Spent $${spent.toFixed(2)} of $${budget.amount.toFixed(2)}.`
            : `You're at ${percentSpent.toFixed(0)}% of your ${categoryName} budget. $${remaining.toFixed(2)} remaining.`,
        type: 'budget_warning',
        priority: alertLevel === 'critical' ? 'high' : 'normal',
        link: '/budgets',
        resourceType: 'budget',
        resourceId: budget.id,
        metadata: JSON.stringify({
          level: alertLevel,
          percentSpent,
          spent,
          budgeted: budget.amount,
          remaining,
          month: currentMonth,
        }),
      });
      generated++;
    }
  }

  return generated;
}

/**
 * Generate insurance renewal reminders
 */
async function generateInsuranceRenewals(
  householdId: string,
  userIds: string[]
): Promise<number> {
  const now = new Date();
  const warningDays = [30, 7, 1];

  // Get active insurance policies
  const activePolicies = await db.query.insurancePolicies.findMany({
    where: and(
      eq(insurancePolicies.householdId, householdId),
      eq(insurancePolicies.status, 'active'),
      gte(insurancePolicies.renewalDate, now)
    ),
  });

  let generated = 0;

  for (const policy of activePolicies) {
    if (!policy.renewalDate) continue;

    const daysUntilRenewal = Math.ceil(
      (policy.renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if this is a warning day
    const warningDay = warningDays.find((d) => daysUntilRenewal <= d && daysUntilRenewal > 0);
    if (!warningDay) continue;
    // Check if we've already notified for this warning period
    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        inArray(notifications.userId, userIds),
        eq(notifications.type, 'transaction_alert'),
        eq(notifications.resourceType, 'insurance_policy'),
        eq(notifications.resourceId, policy.id),
        sql`${notifications.metadata} LIKE ${`%"warningDay":${warningDay}%`}`
      ),
    });

    if (existingNotification) continue;

    // Create renewal reminder
    const urgencyText =
      warningDay === 1
        ? 'tomorrow'
        : warningDay === 7
          ? 'in 1 week'
          : `in ${warningDay} days`;

    for (const userId of userIds) {
      await db.insert(notifications).values({
        userId,
        title: 'Insurance Renewal Due',
        message: `Your ${policy.name} policy with ${policy.provider} is due for renewal ${urgencyText}.`,
        type: 'transaction_alert',
        priority: warningDay <= 7 ? 'high' : 'normal',
        link: '/insurance',
        resourceType: 'insurance_policy',
        resourceId: policy.id,
        metadata: JSON.stringify({
          warningDay,
          renewalDate: policy.renewalDate.toISOString(),
          provider: policy.provider,
          premium: policy.premiumAmount,
        }),
      });
      generated++;
    }
  }

  return generated;
}

/**
 * GET /api/jobs/generate-notifications
 *
 * Get recent notification generation stats
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id) {
    return unauthorized('Please log in');
  }

  try {
    // Get recent notifications count
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, session.user.id),
        gte(notifications.createdAt, last24Hours)
      ),
    });

    const byType: Record<string, number> = {};
    for (const n of recentNotifications) {
      byType[n.type] = (byType[n.type] || 0) + 1;
    }

    return json({
      recentCount: recentNotifications.length,
      byType,
      unreadCount: recentNotifications.filter((n) => !n.isRead).length,
    });
  } catch (err) {
    console.error('Error fetching notification stats:', err);
    return error('Failed to fetch stats', 500);
  }
};
