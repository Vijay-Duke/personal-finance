/**
 * Price Refresh Service
 * Fetches live prices and updates account valuations
 */

import { db } from '@/lib/db';
import { accounts, stocks, cryptoAssets, valuationHistory } from '@/lib/db/schema/accounts';
import { dataSources } from '@/lib/db/schema/integrations';
import { eq, and } from 'drizzle-orm';
import { yahooFinance } from './yahoo-finance';
import { coinGecko } from './coingecko';

export interface PriceRefreshResult {
  stocks: {
    updated: number;
    errors: string[];
    prices: Record<string, number>;
  };
  crypto: {
    updated: number;
    errors: string[];
    prices: Record<string, number>;
  };
}

/**
 * Format date as YYYY-MM-DD for valuation history
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Refresh all stock prices from Yahoo Finance
 */
export async function refreshStockPrices(householdId: string): Promise<{
  updated: number;
  errors: string[];
  prices: Record<string, number>;
}> {
  const errors: string[] = [];
  const prices: Record<string, number> = {};

  try {
    // Get all stock accounts for household
    const stockAccountList = await db
      .select({
        id: accounts.id,
        currency: accounts.currency,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.householdId, householdId),
          eq(accounts.type, 'stock'),
          eq(accounts.isActive, true)
        )
      );

    if (stockAccountList.length === 0) {
      return { updated: 0, errors, prices };
    }

    // Get all stocks for these accounts
    const allStocks = await Promise.all(
      stockAccountList.map(async (acc) => {
        const [stockDetail] = await db
          .select()
          .from(stocks)
          .where(eq(stocks.accountId, acc.id));
        return { account: acc, stock: stockDetail };
      })
    );

    // Get unique symbols
    const symbols = [...new Set(
      allStocks
        .map(s => s.stock?.symbol)
        .filter((sym): sym is string => !!sym)
    )];

    if (symbols.length === 0) {
      return { updated: 0, errors, prices };
    }

    // Fetch prices from Yahoo Finance
    const quotes = await yahooFinance.getQuotes(symbols);
    const priceMap = new Map(quotes.map(q => [q.symbol, q]));

    // Collect batch updates for better performance
    const today = formatDate(new Date());
    const now = new Date();
    const stockUpdates: Promise<unknown>[] = [];
    const accountUpdates: Promise<unknown>[] = [];
    const valuationInserts: Array<{
      accountId: string;
      date: string;
      value: number;
      currency: string;
      source: 'api';
      underlyingPrice: number;
      quantity: number;
    }> = [];

    for (const { account, stock } of allStocks) {
      if (!stock?.symbol) continue;

      const quote = priceMap.get(stock.symbol);
      if (!quote || quote.regularMarketPrice === null) {
        errors.push(`No price found for ${stock.symbol}`);
        continue;
      }

      const currentPrice = quote.regularMarketPrice;
      const shares = stock.shares || 0;
      const currentValue = shares * currentPrice;

      // Collect update operations
      stockUpdates.push(
        db.update(stocks)
          .set({
            currentPrice,
            priceUpdatedAt: now,
            updatedAt: now,
          })
          .where(eq(stocks.accountId, account.id))
      );

      accountUpdates.push(
        db.update(accounts)
          .set({
            currentBalance: currentValue,
            updatedAt: now,
          })
          .where(eq(accounts.id, account.id))
      );

      valuationInserts.push({
        accountId: account.id,
        date: today,
        value: currentValue,
        currency: account.currency || 'USD',
        source: 'api',
        underlyingPrice: currentPrice,
        quantity: shares,
      });

      prices[stock.symbol] = currentPrice;
    }

    // Execute all updates in parallel
    await Promise.all([
      ...stockUpdates,
      ...accountUpdates,
      valuationInserts.length > 0
        ? db.insert(valuationHistory).values(valuationInserts)
        : Promise.resolve(),
    ]);

    const updated = valuationInserts.length;

    // Update data source last sync
    await db.update(dataSources)
      .set({ lastSyncAt: new Date() })
      .where(and(
        eq(dataSources.householdId, householdId),
        eq(dataSources.provider, 'yahoo_finance')
      ));

    return { updated, errors, prices };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(message);
    return { updated: 0, errors, prices };
  }
}

/**
 * Refresh all crypto prices from CoinGecko
 */
export async function refreshCryptoPrices(householdId: string): Promise<{
  updated: number;
  errors: string[];
  prices: Record<string, number>;
}> {
  const errors: string[] = [];
  const prices: Record<string, number> = {};

  try {
    // Get all crypto accounts for household
    const cryptoAccountList = await db
      .select({
        id: accounts.id,
        currency: accounts.currency,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.householdId, householdId),
          eq(accounts.type, 'crypto'),
          eq(accounts.isActive, true)
        )
      );

    if (cryptoAccountList.length === 0) {
      return { updated: 0, errors, prices };
    }

    // Get crypto details for each account
    const allCrypto = await Promise.all(
      cryptoAccountList.map(async (acc) => {
        const [cryptoDetail] = await db
          .select()
          .from(cryptoAssets)
          .where(eq(cryptoAssets.accountId, acc.id));
        return { account: acc, crypto: cryptoDetail };
      })
    );

    // Get unique coingecko IDs
    const coinIds = [...new Set(
      allCrypto
        .map(c => c.crypto?.coingeckoId)
        .filter((id): id is string => !!id)
    )];

    if (coinIds.length === 0) {
      return { updated: 0, errors, prices };
    }

    // Fetch prices from CoinGecko
    const priceData = await coinGecko.getPrice(coinIds, ['usd']);

    // Collect batch updates for better performance
    const today = formatDate(new Date());
    const now = new Date();
    const cryptoUpdates: Promise<unknown>[] = [];
    const accountUpdates: Promise<unknown>[] = [];
    const valuationInserts: Array<{
      accountId: string;
      date: string;
      value: number;
      currency: string;
      source: 'api';
      underlyingPrice: number;
      quantity: number;
    }> = [];

    for (const { account, crypto } of allCrypto) {
      if (!crypto?.coingeckoId || !crypto?.symbol) continue;

      const priceInfo = priceData[crypto.coingeckoId];
      if (!priceInfo) {
        errors.push(`No price found for ${crypto.symbol} (${crypto.coingeckoId})`);
        continue;
      }

      const currentPrice = priceInfo.usd;
      const holdings = crypto.holdings || 0;
      const currentValue = holdings * currentPrice;

      // Collect update operations
      cryptoUpdates.push(
        db.update(cryptoAssets)
          .set({
            currentPrice,
            priceUpdatedAt: now,
            updatedAt: now,
          })
          .where(eq(cryptoAssets.accountId, account.id))
      );

      accountUpdates.push(
        db.update(accounts)
          .set({
            currentBalance: currentValue,
            updatedAt: now,
          })
          .where(eq(accounts.id, account.id))
      );

      valuationInserts.push({
        accountId: account.id,
        date: today,
        value: currentValue,
        currency: 'USD',
        source: 'api',
        underlyingPrice: currentPrice,
        quantity: holdings,
      });

      prices[crypto.symbol] = currentPrice;
    }

    // Execute all updates in parallel
    await Promise.all([
      ...cryptoUpdates,
      ...accountUpdates,
      valuationInserts.length > 0
        ? db.insert(valuationHistory).values(valuationInserts)
        : Promise.resolve(),
    ]);

    const updated = valuationInserts.length;

    // Update data source last sync
    await db.update(dataSources)
      .set({ lastSyncAt: new Date() })
      .where(and(
        eq(dataSources.householdId, householdId),
        eq(dataSources.provider, 'coingecko')
      ));

    return { updated, errors, prices };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(message);
    return { updated: 0, errors, prices };
  }
}

/**
 * Refresh all prices (stocks and crypto)
 */
export async function refreshAllPrices(householdId: string): Promise<PriceRefreshResult> {
  const [stockResult, cryptoResult] = await Promise.all([
    refreshStockPrices(householdId),
    refreshCryptoPrices(householdId),
  ]);

  return {
    stocks: stockResult,
    crypto: cryptoResult,
  };
}

/**
 * Get latest valuation for an account
 */
export async function getLatestValuation(accountId: string) {
  const [valuation] = await db
    .select()
    .from(valuationHistory)
    .where(eq(valuationHistory.accountId, accountId))
    .orderBy(valuationHistory.date)
    .limit(1);

  return valuation || null;
}

/**
 * Get valuation history for an account
 */
export async function getValuationHistory(accountId: string) {
  return db
    .select()
    .from(valuationHistory)
    .where(eq(valuationHistory.accountId, accountId))
    .orderBy(valuationHistory.date);
}
