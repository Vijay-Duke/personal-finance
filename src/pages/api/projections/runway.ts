import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, transactions } from '../../../lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/projections/runway
 * Calculate financial runway - how long current savings would last
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const householdId = session.user.householdId;

  try {
    // Get all liquid accounts (bank accounts, cash, etc.)
    const liquidAccounts = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        currentBalance: accounts.currentBalance,
        currency: accounts.currency,
        isLiquid: accounts.isLiquid,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.householdId, householdId),
          eq(accounts.isActive, true),
          eq(accounts.isLiquid, true)
        )
      );

    // Calculate total liquid assets
    const totalLiquidAssets = liquidAccounts.reduce(
      (sum, acc) => sum + (acc.currentBalance || 0),
      0
    );

    // Get transactions from the last 3 months to calculate average expenses
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentTransactions = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, threeMonthsAgo),
          lte(transactions.date, new Date())
        )
      );

    // Calculate total expenses over the period
    const totalExpenses = recentTransactions.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0
    );

    // Calculate months covered (approximate)
    const now = new Date();
    const monthsCovered = Math.max(1,
      (now.getFullYear() - threeMonthsAgo.getFullYear()) * 12 +
      (now.getMonth() - threeMonthsAgo.getMonth())
    );

    // Calculate average monthly expenses
    const averageMonthlyExpenses = totalExpenses / monthsCovered;

    // Calculate runway in months
    const runwayMonths = averageMonthlyExpenses > 0
      ? Math.floor(totalLiquidAssets / averageMonthlyExpenses)
      : null; // null if no expenses recorded

    // Get income for additional context
    const recentIncomeTransactions = await db
      .select({
        amount: transactions.amount,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          eq(transactions.type, 'income'),
          gte(transactions.date, threeMonthsAgo),
          lte(transactions.date, new Date())
        )
      );

    const totalIncome = recentIncomeTransactions.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0
    );
    const averageMonthlyIncome = totalIncome / monthsCovered;

    // Net savings rate
    const netMonthlySavings = averageMonthlyIncome - averageMonthlyExpenses;
    const savingsRate = averageMonthlyIncome > 0
      ? (netMonthlySavings / averageMonthlyIncome) * 100
      : 0;

    // Project when liquid assets would reach zero (burn rate) or a target
    const monthsToZero = runwayMonths;

    // Project when liquid assets would reach 6 months of expenses (emergency fund target)
    const emergencyFundTarget = averageMonthlyExpenses * 6;
    const emergencyFundProgress = emergencyFundTarget > 0
      ? (totalLiquidAssets / emergencyFundTarget) * 100
      : 0;

    return json({
      liquidAssets: {
        total: totalLiquidAssets,
        accounts: liquidAccounts.length,
        breakdown: liquidAccounts.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: a.currentBalance,
          currency: a.currency,
        })),
      },
      expenses: {
        total: totalExpenses,
        averageMonthly: averageMonthlyExpenses,
        monthsAnalyzed: monthsCovered,
        transactionCount: recentTransactions.length,
      },
      income: {
        total: totalIncome,
        averageMonthly: averageMonthlyIncome,
      },
      runway: {
        months: runwayMonths,
        years: runwayMonths ? Math.floor(runwayMonths / 12) : null,
        remainingMonths: runwayMonths ? runwayMonths % 12 : null,
        // Display-friendly format
        formatted: formatRunway(runwayMonths),
      },
      savings: {
        netMonthly: netMonthlySavings,
        rate: savingsRate,
        isPositive: netMonthlySavings > 0,
      },
      emergencyFund: {
        target: emergencyFundTarget,
        current: totalLiquidAssets,
        progress: emergencyFundProgress,
        monthsCovered: averageMonthlyExpenses > 0
          ? totalLiquidAssets / averageMonthlyExpenses
          : 0,
        isHealthy: emergencyFundProgress >= 100, // Has 6+ months
      },
      calculatedAt: new Date().toISOString(),
      currency: 'USD', // Primary household currency
    });
  } catch (err) {
    console.error('Error calculating runway:', err);
    return error('Failed to calculate runway', 500);
  }
};

/**
 * Format runway months into a human-readable string
 */
function formatRunway(months: number | null): string {
  if (months === null) {
    return 'Unable to calculate (no expense data)';
  }
  if (months <= 0) {
    return 'No runway (expenses exceed assets)';
  }
  if (months === 1) {
    return '1 month';
  }
  if (months < 12) {
    return `${months} months`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }

  const yearStr = years === 1 ? '1 year' : `${years} years`;
  const monthStr = remainingMonths === 1 ? '1 month' : `${remainingMonths} months`;

  return `${yearStr}, ${monthStr}`;
}
