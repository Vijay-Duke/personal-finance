import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  accounts,
  stocks,
  cryptoAssets,
  netWorthSnapshots,
  households,
} from '../../../lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { json, error, unauthorized } from '../../../lib/api/response';
import { getSession } from '../../../lib/auth/session';

/**
 * POST /api/jobs/snapshot-networth
 *
 * Daily job to create net worth snapshots for all households.
 * Should be called by a cron job or scheduler daily at midnight.
 *
 * Query params:
 * - householdId: Optional - snapshot only this household
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

  try {
    // Get households to process
    const targetHouseholds = specificHouseholdId
      ? await db
          .select({ id: households.id, primaryCurrency: households.primaryCurrency })
          .from(households)
          .where(eq(households.id, specificHouseholdId))
      : await db
          .select({ id: households.id, primaryCurrency: households.primaryCurrency })
          .from(households);

    if (targetHouseholds.length === 0) {
      return error('No households found', 404);
    }

    const results: {
      householdId: string;
      snapshotId: string;
      netWorth: number;
    }[] = [];

    const errors: string[] = [];

    // Process each household
    for (const household of targetHouseholds) {
      try {
        const snapshot = await createNetWorthSnapshot(
          household.id,
          household.primaryCurrency || 'USD'
        );
        results.push({
          householdId: household.id,
          snapshotId: snapshot.id,
          netWorth: snapshot.netWorth,
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
      snapshots: results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error running net worth snapshot job:', err);
    return error('Failed to run snapshot job', 500);
  }
};

/**
 * Create a net worth snapshot for a single household
 */
async function createNetWorthSnapshot(householdId: string, primaryCurrency: string) {
  // Get all active accounts for this household
  const allAccounts = await db
    .select({
      id: accounts.id,
      type: accounts.type,
      currentBalance: accounts.currentBalance,
      includeInNetWorth: accounts.includeInNetWorth,
      currency: accounts.currency,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.householdId, householdId),
        eq(accounts.isActive, true),
        eq(accounts.includeInNetWorth, true)
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

  // Calculate breakdown by type
  const breakdown: Record<string, number> = {};
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of allAccounts) {
    let accountValue: number;

    // Use market value for stocks and crypto, balance for others
    if (account.type === 'stock') {
      accountValue = stockValueMap.get(account.id) || account.currentBalance;
    } else if (account.type === 'crypto') {
      accountValue = cryptoValueMap.get(account.id) || account.currentBalance;
    } else {
      accountValue = account.currentBalance;
    }

    // Track by type
    if (!breakdown[account.type]) {
      breakdown[account.type] = 0;
    }
    breakdown[account.type] += accountValue;

    // Categorize as asset or debt
    if (account.type === 'debt') {
      totalLiabilities += Math.abs(accountValue);
    } else if (accountValue >= 0) {
      totalAssets += accountValue;
    } else {
      totalLiabilities += Math.abs(accountValue);
    }
  }

  const netWorth = totalAssets - totalLiabilities;

  // Normalize date to midnight UTC
  const now = new Date();
  const snapshotDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );

  // Check if snapshot already exists for today
  const existingSnapshot = await db.query.netWorthSnapshots.findFirst({
    where: and(
      eq(netWorthSnapshots.householdId, householdId),
      sql`date(${netWorthSnapshots.date}) = date(${snapshotDate})`
    ),
  });

  if (existingSnapshot) {
    // Update existing snapshot
    await db
      .update(netWorthSnapshots)
      .set({
        totalAssets,
        totalLiabilities,
        netWorth,
        breakdown,
        primaryCurrency,
      })
      .where(eq(netWorthSnapshots.id, existingSnapshot.id));

    return {
      id: existingSnapshot.id,
      totalAssets,
      totalLiabilities,
      netWorth,
      breakdown,
      updated: true,
    };
  }

  // Create new snapshot
  const [newSnapshot] = await db
    .insert(netWorthSnapshots)
    .values({
      householdId,
      date: snapshotDate,
      totalAssets,
      totalLiabilities,
      netWorth,
      breakdown,
      primaryCurrency,
    })
    .returning();

  return {
    id: newSnapshot.id,
    totalAssets,
    totalLiabilities,
    netWorth,
    breakdown,
    updated: false,
  };
}

/**
 * GET /api/jobs/snapshot-networth
 *
 * Get the status/info about the snapshot job
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in');
  }

  const householdId = session.user.householdId;

  try {
    // Get latest snapshot
    const latestSnapshot = await db.query.netWorthSnapshots.findFirst({
      where: eq(netWorthSnapshots.householdId, householdId),
      orderBy: (snapshots, { desc }) => [desc(snapshots.date)],
    });

    // Get snapshot count for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSnapshots = await db.query.netWorthSnapshots.findMany({
      where: and(
        eq(netWorthSnapshots.householdId, householdId),
        sql`${netWorthSnapshots.date} >= ${thirtyDaysAgo}`
      ),
    });

    return json({
      latestSnapshot: latestSnapshot
        ? {
            date: latestSnapshot.date,
            netWorth: latestSnapshot.netWorth,
            totalAssets: latestSnapshot.totalAssets,
            totalLiabilities: latestSnapshot.totalLiabilities,
          }
        : null,
      recentSnapshotsCount: recentSnapshots.length,
      hasDataForLast30Days: recentSnapshots.length >= 30,
    });
  } catch (err) {
    console.error('Error fetching snapshot status:', err);
    return error('Failed to fetch snapshot status', 500);
  }
};
