import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, cryptoAssets, type NewCryptoAsset } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/crypto
 * List all crypto holdings with their details.
 *
 * Query params:
 * - active: Filter by active status (true/false)
 * - storageType: Filter by storage type (exchange, hot_wallet, cold_wallet, hardware)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const activeFilter = url.searchParams.get('active');
  const storageTypeFilter = url.searchParams.get('storageType');

  try {
    const conditions = [
      eq(accounts.householdId, session.user.householdId),
      eq(accounts.type, 'crypto'),
    ];

    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }

    // Join accounts with crypto details
    const results = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        currency: accounts.currency,
        currentBalance: accounts.currentBalance,
        isActive: accounts.isActive,
        isLiquid: accounts.isLiquid,
        includeInNetWorth: accounts.includeInNetWorth,
        expectedAnnualReturnRate: accounts.expectedAnnualReturnRate,
        icon: accounts.icon,
        color: accounts.color,
        sortOrder: accounts.sortOrder,
        notes: accounts.notes,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
        // Crypto-specific fields
        cryptoId: cryptoAssets.id,
        symbol: cryptoAssets.symbol,
        cryptoName: cryptoAssets.name,
        coingeckoId: cryptoAssets.coingeckoId,
        network: cryptoAssets.network,
        holdings: cryptoAssets.holdings,
        avgCostBasis: cryptoAssets.avgCostBasis,
        totalCostBasis: cryptoAssets.totalCostBasis,
        currentPrice: cryptoAssets.currentPrice,
        priceUpdatedAt: cryptoAssets.priceUpdatedAt,
        storageType: cryptoAssets.storageType,
        exchangeName: cryptoAssets.exchangeName,
        walletAddress: cryptoAssets.walletAddress,
        walletName: cryptoAssets.walletName,
        isStaked: cryptoAssets.isStaked,
        stakingApy: cryptoAssets.stakingApy,
      })
      .from(accounts)
      .leftJoin(cryptoAssets, eq(accounts.id, cryptoAssets.accountId))
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    // Filter by storage type if specified
    const filtered = storageTypeFilter
      ? results.filter(r => r.storageType === storageTypeFilter)
      : results;

    // Calculate market value and gain/loss for each holding
    const enriched = filtered.map(crypto => ({
      ...crypto,
      marketValue: (crypto.holdings || 0) * (crypto.currentPrice || 0),
      unrealizedGain: ((crypto.holdings || 0) * (crypto.currentPrice || 0)) - (crypto.totalCostBasis || 0),
      unrealizedGainPercent: crypto.totalCostBasis
        ? (((crypto.holdings || 0) * (crypto.currentPrice || 0)) - crypto.totalCostBasis) / crypto.totalCostBasis * 100
        : 0,
    }));

    return json(enriched);
  } catch (err) {
    console.error('Error fetching crypto:', err);
    return error('Failed to fetch crypto holdings', 500);
  }
};

/**
 * POST /api/accounts/crypto
 * Create a new crypto holding.
 *
 * Request body:
 * - symbol: string (required, e.g., 'BTC', 'ETH')
 * - name: string (optional, e.g., 'Bitcoin')
 * - coingeckoId: string (optional, for API lookups)
 * - network: string (optional, e.g., 'mainnet', 'polygon')
 * - holdings: number (amount of crypto owned)
 * - avgCostBasis: number (cost per unit in USD)
 * - storageType: 'exchange' | 'hot_wallet' | 'cold_wallet' | 'hardware'
 * - exchangeName: string (e.g., 'Coinbase', 'Binance')
 * - walletAddress: string (public address for reference)
 * - walletName: string (user-friendly wallet name)
 * - isStaked: boolean
 * - stakingApy: number (as decimal)
 * - currency: string (default: 'USD')
 * - notes: string
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    // Validate required fields
    if (!body.symbol?.trim()) {
      return error('Crypto symbol is required');
    }

    const symbol = body.symbol.trim().toUpperCase();
    const name = body.name?.trim() || symbol;
    const holdings = body.holdings || 0;
    const avgCostBasis = body.avgCostBasis || 0;
    const totalCostBasis = holdings * avgCostBasis;

    // Create base account
    const [newAccount] = await db.insert(accounts).values({
      householdId: session.user.householdId,
      name,
      type: 'crypto',
      currency: body.currency || 'USD',
      currentBalance: totalCostBasis, // Initial balance is cost basis
      isActive: body.isActive ?? true,
      isLiquid: body.isLiquid ?? true,
      includeInNetWorth: body.includeInNetWorth ?? true,
      expectedAnnualReturnRate: body.expectedAnnualReturnRate,
      icon: body.icon || 'currency-bitcoin',
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    }).returning();

    // Create crypto details
    const cryptoData: NewCryptoAsset = {
      accountId: newAccount.id,
      symbol,
      name: body.name,
      coingeckoId: body.coingeckoId,
      network: body.network,
      holdings,
      avgCostBasis,
      totalCostBasis,
      currentPrice: body.currentPrice || 0,
      storageType: body.storageType,
      exchangeName: body.exchangeName,
      walletAddress: body.walletAddress,
      walletName: body.walletName,
      isStaked: body.isStaked ?? false,
      stakingApy: body.stakingApy || 0,
    };

    const [cryptoDetail] = await db.insert(cryptoAssets).values(cryptoData).returning();

    return created({
      ...newAccount,
      ...cryptoDetail,
      marketValue: holdings * (body.currentPrice || 0),
    });
  } catch (err) {
    console.error('Error creating crypto:', err);
    return error('Failed to create crypto holding', 500);
  }
};
