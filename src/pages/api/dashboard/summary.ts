import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, stocks, cryptoAssets } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized } from '../../../lib/api/response';

interface AccountBreakdown {
  type: string;
  label: string;
  value: number;
  count: number;
}

interface DashboardSummary {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  cashBalance: number;
  investmentValue: number;
  cryptoValue: number;
  breakdown: AccountBreakdown[];
  change: {
    netWorth: { value: number; percent: number };
  };
}

/**
 * GET /api/dashboard/summary
 * Returns aggregated net worth and account breakdown for the dashboard.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const householdId = session.user.householdId;

    // Fetch all active accounts for this household
    const allAccounts = await db
      .select({
        id: accounts.id,
        type: accounts.type,
        currentBalance: accounts.currentBalance,
        isActive: accounts.isActive,
        includeInNetWorth: accounts.includeInNetWorth,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.householdId, householdId),
          eq(accounts.isActive, true)
        )
      );

    // Fetch stock details for market value calculation
    const stockHoldings = await db
      .select({
        accountId: stocks.accountId,
        shares: stocks.shares,
        currentPrice: stocks.currentPrice,
      })
      .from(stocks)
      .innerJoin(accounts, eq(stocks.accountId, accounts.id))
      .where(
        and(
          eq(accounts.householdId, householdId),
          eq(accounts.isActive, true)
        )
      );

    // Fetch crypto details for market value calculation
    const cryptoHoldings = await db
      .select({
        accountId: cryptoAssets.accountId,
        holdings: cryptoAssets.holdings,
        currentPrice: cryptoAssets.currentPrice,
      })
      .from(cryptoAssets)
      .innerJoin(accounts, eq(cryptoAssets.accountId, accounts.id))
      .where(
        and(
          eq(accounts.householdId, householdId),
          eq(accounts.isActive, true)
        )
      );

    // Create lookup maps for investment values
    const stockValueMap = new Map<string, number>();
    for (const stock of stockHoldings) {
      const marketValue = (stock.shares || 0) * (stock.currentPrice || 0);
      stockValueMap.set(stock.accountId, marketValue);
    }

    const cryptoValueMap = new Map<string, number>();
    for (const crypto of cryptoHoldings) {
      const marketValue = (crypto.holdings || 0) * (crypto.currentPrice || 0);
      cryptoValueMap.set(crypto.accountId, marketValue);
    }

    // Calculate totals by account type
    const breakdown: Record<string, { value: number; count: number }> = {};
    let totalAssets = 0;
    let totalDebts = 0;
    let cashBalance = 0;
    let investmentValue = 0;
    let cryptoValue = 0;

    for (const account of allAccounts) {
      if (!account.includeInNetWorth) continue;

      let accountValue: number;

      // Use market value for stocks and crypto, balance for others
      if (account.type === 'stock') {
        accountValue = stockValueMap.get(account.id) || account.currentBalance;
        investmentValue += accountValue;
      } else if (account.type === 'crypto') {
        accountValue = cryptoValueMap.get(account.id) || account.currentBalance;
        cryptoValue += accountValue;
      } else if (account.type === 'bank_account') {
        accountValue = account.currentBalance;
        cashBalance += accountValue;
      } else {
        accountValue = account.currentBalance;
      }

      // Track by type
      if (!breakdown[account.type]) {
        breakdown[account.type] = { value: 0, count: 0 };
      }
      breakdown[account.type].value += accountValue;
      breakdown[account.type].count += 1;

      // Categorize as asset or debt
      // Debt accounts store positive balances but represent liabilities
      if (account.type === 'debt') {
        totalDebts += Math.abs(accountValue);
      } else if (accountValue >= 0) {
        totalAssets += accountValue;
      } else {
        totalDebts += Math.abs(accountValue);
      }
    }

    // Format breakdown for response
    const typeLabels: Record<string, string> = {
      bank_account: 'Cash & Bank Accounts',
      stock: 'Stocks & Investments',
      crypto: 'Cryptocurrency',
      real_estate: 'Real Estate',
      debt: 'Debts & Liabilities',
      superannuation: 'Superannuation',
      personal_asset: 'Personal Assets',
      business_asset: 'Business Assets',
    };

    const formattedBreakdown: AccountBreakdown[] = Object.entries(breakdown)
      .map(([type, data]) => ({
        type,
        label: typeLabels[type] || type,
        value: data.value,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);

    const netWorth = totalAssets - totalDebts;

    // TODO: Calculate change from previous period (requires ValuationHistory)
    // For now, return zeros
    const summary: DashboardSummary = {
      netWorth,
      totalAssets,
      totalDebts,
      cashBalance,
      investmentValue,
      cryptoValue,
      breakdown: formattedBreakdown,
      change: {
        netWorth: { value: 0, percent: 0 },
      },
    };

    return json(summary);
  } catch (err) {
    console.error('Error calculating dashboard summary:', err);
    return error('Failed to calculate dashboard summary', 500);
  }
};
