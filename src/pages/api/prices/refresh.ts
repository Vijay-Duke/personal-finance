/**
 * POST /api/prices/refresh
 * Refresh live prices for stocks and crypto holdings
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session';
import { refreshAllPrices, refreshStockPrices, refreshCryptoPrices } from '@/lib/integrations/price-refresh';
import { json, error, unauthorized } from '@/lib/api/response';

export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const householdId = session.user.householdId;

  try {
    // Parse request body for optional type filter
    const body = await context.request.json().catch(() => ({}));
    const type = body.type as 'stocks' | 'crypto' | 'all' | undefined;

    let result;

    if (type === 'stocks') {
      result = { stocks: await refreshStockPrices(householdId), crypto: { updated: 0, errors: [], prices: {} } };
    } else if (type === 'crypto') {
      result = { stocks: { updated: 0, errors: [], prices: {} }, crypto: await refreshCryptoPrices(householdId) };
    } else {
      // Refresh all
      result = await refreshAllPrices(householdId);
    }

    const totalUpdated = result.stocks.updated + result.crypto.updated;
    const allErrors = [...result.stocks.errors, ...result.crypto.errors];

    return json({
      success: allErrors.length === 0,
      updated: totalUpdated,
      stocks: result.stocks,
      crypto: result.crypto,
      errors: allErrors.length > 0 ? allErrors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error refreshing prices:', err);
    return error(err instanceof Error ? err.message : 'Failed to refresh prices', 500);
  }
};

/**
 * GET /api/prices/refresh
 * Get status of price refresh (last update times)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const householdId = session.user.householdId;

  try {
    const { db } = await import('@/lib/db');
    const { dataSources } = await import('@/lib/db/schema/integrations');
    const { eq, and } = await import('drizzle-orm');

    // Get last sync times for price data sources
    const sources = await db.query.dataSources.findMany({
      where: and(
        eq(dataSources.householdId, householdId),
        eq(dataSources.isEnabled, true)
      ),
    });

    const stockSource = sources.find(s => s.provider === 'yahoo_finance');
    const cryptoSource = sources.find(s => s.provider === 'coingecko');

    return json({
      stocks: {
        lastSync: stockSource?.lastSyncAt || null,
        enabled: !!stockSource,
      },
      crypto: {
        lastSync: cryptoSource?.lastSyncAt || null,
        enabled: !!cryptoSource,
      },
    });
  } catch (err) {
    console.error('Error getting refresh status:', err);
    return error('Failed to get status', 500);
  }
};
