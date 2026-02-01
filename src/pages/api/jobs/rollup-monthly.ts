import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  transactions,
  monthlyAnalyticsRollups,
  households,
} from '../../../lib/db/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';
import { json, error, unauthorized } from '../../../lib/api/response';
import { getSession } from '../../../lib/auth/session';

/**
 * POST /api/jobs/rollup-monthly
 *
 * Monthly aggregation job to create analytics rollups.
 * Should be called at month-end or early in the new month.
 *
 * Query params:
 * - householdId: Optional - process only this household
 * - year: Optional - specific year (defaults to current)
 * - month: Optional - specific month 1-12 (defaults to previous month)
 * - secret: Optional API secret for system calls (set JOBS_API_SECRET env var)
 */
export const POST: APIRoute = async (context) => {
  // Check authentication - either valid session or API secret
  const session = await getSession(context);
  const url = new URL(context.request.url);
  const providedSecret = url.searchParams.get('secret');
  const expectedSecret = import.meta.env.JOBS_API_SECRET;

  // Allow if authenticated user OR correct API secret
  const isAuthenticated = !!session?.user?.id;
  const hasValidSecret = expectedSecret && providedSecret === expectedSecret;

  if (!isAuthenticated && !hasValidSecret) {
    return unauthorized('Authentication required');
  }

  const specificHouseholdId = url.searchParams.get('householdId');
  const yearParam = url.searchParams.get('year');
  const monthParam = url.searchParams.get('month');

  try {
    // Determine target month
    const now = new Date();
    let targetYear: number;
    let targetMonth: number;

    if (yearParam && monthParam) {
      targetYear = parseInt(yearParam);
      targetMonth = parseInt(monthParam);
    } else {
      // Default to previous month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetYear = lastMonth.getFullYear();
      targetMonth = lastMonth.getMonth() + 1; // 1-indexed
    }

    const monthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

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
      rollupsCreated: number;
      month: string;
    }[] = [];

    const errors: string[] = [];

    // Process each household
    for (const household of targetHouseholds) {
      try {
        const rollupCount = await createMonthlyRollup(
          household.id,
          targetYear,
          targetMonth
        );
        results.push({
          householdId: household.id,
          rollupsCreated: rollupCount,
          month: monthStr,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Household ${household.id}: ${message}`);
      }
    }

    return json({
      success: true,
      processed: results.length,
      failed: errors.length,
      month: monthStr,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error running monthly rollup job:', err);
    return error('Failed to run rollup job', 500);
  }
};

/**
 * Create monthly rollup for a single household
 */
async function createMonthlyRollup(
  householdId: string,
  year: number,
  month: number
): Promise<number> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1); // month is 0-indexed in Date
  const endDate = new Date(year, month, 1); // First day of next month

  // Get all transactions for this household in the target month
  const monthTransactions = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      categoryId: transactions.categoryId,
      date: transactions.date,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.householdId, householdId),
        gte(transactions.date, startDate),
        lt(transactions.date, endDate),
        eq(transactions.status, 'cleared') // Only count cleared transactions
      )
    );

  // Calculate aggregates by category
  const categoryStats: Map<
    string,
    {
      totalIncome: number;
      totalExpense: number;
      totalTransfers: number;
      transactionCount: number;
    }
  > = new Map();

  // Track totals (no category)
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransfers = 0;
  let uniqueDays = new Set<string>();
  let largestTransaction = 0;
  let totalTransactionAmount = 0;

  for (const tx of monthTransactions) {
    // Track unique days
    if (tx.date) {
      uniqueDays.add(tx.date.toISOString().split('T')[0]);
    }

    // Track largest transaction
    const absAmount = Math.abs(tx.amount || 0);
    if (absAmount > largestTransaction) {
      largestTransaction = absAmount;
    }
    totalTransactionAmount += absAmount;

    // Aggregate by type
    switch (tx.type) {
      case 'income':
        totalIncome += tx.amount || 0;
        break;
      case 'expense':
        totalExpense += tx.amount || 0;
        break;
      case 'transfer':
        totalTransfers += tx.amount || 0;
        break;
    }

    // Aggregate by category
    const catId = tx.categoryId || 'uncategorized';
    if (!categoryStats.has(catId)) {
      categoryStats.set(catId, {
        totalIncome: 0,
        totalExpense: 0,
        totalTransfers: 0,
        transactionCount: 0,
      });
    }

    const stats = categoryStats.get(catId)!;
    stats.transactionCount++;

    switch (tx.type) {
      case 'income':
        stats.totalIncome += tx.amount || 0;
        break;
      case 'expense':
        stats.totalExpense += tx.amount || 0;
        break;
      case 'transfer':
        stats.totalTransfers += tx.amount || 0;
        break;
    }
  }

  const averageTransactionSize =
    monthTransactions.length > 0
      ? totalTransactionAmount / monthTransactions.length
      : 0;

  // Delete existing rollups for this household/month
  await db
    .delete(monthlyAnalyticsRollups)
    .where(
      and(
        eq(monthlyAnalyticsRollups.householdId, householdId),
        eq(monthlyAnalyticsRollups.month, monthStr)
      )
    );

  // Insert total rollup (categoryId = null)
  await db.insert(monthlyAnalyticsRollups).values({
    householdId,
    month: monthStr,
    categoryId: null,
    totalIncome,
    totalExpense,
    totalTransfers,
    transactionCount: monthTransactions.length,
    uniqueDaysWithTransactions: uniqueDays.size,
    largestTransaction: largestTransaction > 0 ? largestTransaction : null,
    averageTransactionSize,
  });

  // Insert category rollups
  let categoryRollupCount = 1; // Start at 1 for the total rollup

  for (const [categoryId, stats] of categoryStats) {
    if (categoryId === 'uncategorized') {
      continue; // Skip uncategorized - totals already capture this
    }

    await db.insert(monthlyAnalyticsRollups).values({
      householdId,
      month: monthStr,
      categoryId,
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      totalTransfers: stats.totalTransfers,
      transactionCount: stats.transactionCount,
      uniqueDaysWithTransactions: null, // Not tracked per category
      largestTransaction: null,
      averageTransactionSize: null,
    });

    categoryRollupCount++;
  }

  return categoryRollupCount;
}

/**
 * GET /api/jobs/rollup-monthly
 *
 * Get the status/info about the rollup job
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in');
  }

  const householdId = session.user.householdId;
  const url = new URL(context.request.url);
  const yearParam = url.searchParams.get('year');

  try {
    const targetYear = yearParam
      ? parseInt(yearParam)
      : new Date().getFullYear();

    // Get rollups for the year
    const rollups = await db.query.monthlyAnalyticsRollups.findMany({
      where: and(
        eq(monthlyAnalyticsRollups.householdId, householdId),
        sql`${monthlyAnalyticsRollups.month} LIKE ${targetYear + '-%'}`
      ),
      with: {
        category: true,
      },
      orderBy: (rollups, { asc }) => [asc(rollups.month)],
    });

    // Group by month
    const byMonth: Record<
      string,
      {
        totalIncome: number;
        totalExpense: number;
        netSavings: number;
        transactionCount: number;
      }
    > = {};

    for (const rollup of rollups) {
      if (rollup.categoryId === null) {
        // This is a total rollup
        byMonth[rollup.month] = {
          totalIncome: rollup.totalIncome,
          totalExpense: rollup.totalExpense,
          netSavings: rollup.totalIncome - rollup.totalExpense,
          transactionCount: rollup.transactionCount,
        };
      }
    }

    // Check which months are missing data
    const monthsWithData = Object.keys(byMonth);
    const allMonths = Array.from({ length: 12 }, (_, i) =>
      String(i + 1).padStart(2, '0')
    );
    const missingMonths = allMonths.filter(
      (m) => !monthsWithData.includes(`${targetYear}-${m}`)
    );

    return json({
      year: targetYear,
      monthsWithData: monthsWithData.length,
      missingMonths,
      data: byMonth,
    });
  } catch (err) {
    console.error('Error fetching rollup status:', err);
    return error('Failed to fetch rollup status', 500);
  }
};
