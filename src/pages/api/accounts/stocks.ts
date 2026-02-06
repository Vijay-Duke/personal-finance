import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, stocks, type NewStock } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/stocks
 * List all stock holdings with their details.
 *
 * Query params:
 * - active: Filter by active status (true/false)
 * - broker: Filter by broker name
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const activeFilter = url.searchParams.get('active');
  const brokerFilter = url.searchParams.get('broker');

  try {
    const conditions = [
      eq(accounts.householdId, session.user.householdId),
      eq(accounts.type, 'stock'),
    ];

    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }

    // Join accounts with stock details
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
        // Stock-specific fields
        stockId: stocks.id,
        symbol: stocks.symbol,
        exchange: stocks.exchange,
        securityName: stocks.securityName,
        shares: stocks.shares,
        avgCostBasis: stocks.avgCostBasis,
        totalCostBasis: stocks.totalCostBasis,
        currentPrice: stocks.currentPrice,
        priceUpdatedAt: stocks.priceUpdatedAt,
        broker: stocks.broker,
        brokerAccountId: stocks.brokerAccountId,
        dividendYield: stocks.dividendYield,
        lastDividendDate: stocks.lastDividendDate,
        logo: stocks.logo,
      })
      .from(accounts)
      .leftJoin(stocks, eq(accounts.id, stocks.accountId))
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    // Filter by broker if specified
    const filtered = brokerFilter
      ? results.filter(r => r.broker === brokerFilter)
      : results;

    // Calculate market value and gain/loss for each holding
    const enriched = filtered.map(stock => ({
      ...stock,
      marketValue: (stock.shares || 0) * (stock.currentPrice || 0),
      unrealizedGain: ((stock.shares || 0) * (stock.currentPrice || 0)) - (stock.totalCostBasis || 0),
      unrealizedGainPercent: stock.totalCostBasis
        ? (((stock.shares || 0) * (stock.currentPrice || 0)) - stock.totalCostBasis) / stock.totalCostBasis * 100
        : 0,
    }));

    return json(enriched);
  } catch (err) {
    console.error('Error fetching stocks:', err);
    return error('Failed to fetch stocks', 500);
  }
};

/**
 * POST /api/accounts/stocks
 * Create a new stock holding.
 *
 * Request body:
 * - name: string (optional, defaults to symbol)
 * - symbol: string (required, e.g., 'AAPL')
 * - exchange: string (optional, e.g., 'NASDAQ')
 * - securityName: string (optional, full company name)
 * - shares: number (default: 0)
 * - avgCostBasis: number (cost per share)
 * - broker: string (e.g., 'Vanguard')
 * - brokerAccountId: string
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
      return error('Stock symbol is required');
    }

    const symbol = body.symbol.trim().toUpperCase();
    const name = body.name?.trim() || symbol;
    const shares = body.shares || 0;
    const avgCostBasis = body.avgCostBasis || 0;
    const totalCostBasis = shares * avgCostBasis;

    // Create base account
    const [newAccount] = await db.insert(accounts).values({
      householdId: session.user.householdId,
      name,
      type: 'stock',
      currency: body.currency || 'USD',
      currentBalance: totalCostBasis, // Initial balance is cost basis
      isActive: body.isActive ?? true,
      isLiquid: body.isLiquid ?? true,
      includeInNetWorth: body.includeInNetWorth ?? true,
      expectedAnnualReturnRate: body.expectedAnnualReturnRate,
      icon: body.icon || 'chart-line',
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    }).returning();

    // Create stock details
    const stockData: NewStock = {
      accountId: newAccount.id,
      symbol,
      exchange: body.exchange,
      securityName: body.securityName,
      logo: body.logo,
      shares,
      avgCostBasis,
      totalCostBasis,
      currentPrice: body.currentPrice || 0,
      broker: body.broker,
      brokerAccountId: body.brokerAccountId,
      dividendYield: body.dividendYield,
    };

    const [stockDetail] = await db.insert(stocks).values(stockData).returning();

    return created({
      ...newAccount,
      ...stockDetail,
      marketValue: shares * (body.currentPrice || 0),
    });
  } catch (err) {
    console.error('Error creating stock:', err);
    return error('Failed to create stock', 500);
  }
};
