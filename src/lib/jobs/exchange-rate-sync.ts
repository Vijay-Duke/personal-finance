/**
 * Exchange Rate Sync Job
 * Syncs exchange rates from external APIs on a schedule
 */

import { db } from '@/lib/db';
import { exchangeRates, dataSources } from '@/lib/db/schema/integrations';
import { eq, and, gte, desc } from 'drizzle-orm';
import { frankfurter } from '@/lib/integrations/frankfurter';

// Major currencies to sync by default
const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'NZD', 'INR', 'CNY'];

export interface ExchangeRateSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Sync exchange rates from Frankfurter API
 */
export async function syncExchangeRates(
  baseCurrency: string = 'USD',
  targetCurrencies?: string[]
): Promise<ExchangeRateSyncResult> {
  const result: ExchangeRateSyncResult = {
    success: false,
    inserted: 0,
    updated: 0,
    errors: [],
    timestamp: new Date(),
  };

  try {
    console.log(`🔄 Syncing exchange rates for ${baseCurrency}...`);

    let ratesToSync: Array<{
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      date: Date;
      source: string;
    }>;

    // Use provided currencies or default to major currencies
    const currencies = targetCurrencies && targetCurrencies.length > 0
      ? targetCurrencies
      : MAJOR_CURRENCIES.filter(c => c !== baseCurrency);

    const response = await frankfurter.getLatestRates(baseCurrency, currencies);
    const date = new Date(response.date);

    ratesToSync = Object.entries(response.rates).map(([currency, rate]) => ({
      fromCurrency: baseCurrency,
      toCurrency: currency,
      rate: rate as number,
      date,
      source: 'frankfurter',
    }));

    // Also create inverse rates for convenience
    const inverseRates = ratesToSync.map(r => ({
      fromCurrency: r.toCurrency,
      toCurrency: r.fromCurrency,
      rate: 1 / r.rate,
      date: r.date,
      source: 'frankfurter',
    }));

    ratesToSync = [...ratesToSync, ...inverseRates];

    for (const rate of ratesToSync) {
      try {
        const existing = await db.query.exchangeRates.findFirst({
          where: and(
            eq(exchangeRates.fromCurrency, rate.fromCurrency),
            eq(exchangeRates.toCurrency, rate.toCurrency),
            gte(exchangeRates.date, new Date(rate.date.getTime() - 24 * 60 * 60 * 1000))
          ),
          orderBy: [desc(exchangeRates.date)],
        });

        if (existing) {
          await db.update(exchangeRates)
            .set({ rate: rate.rate, date: rate.date })
            .where(eq(exchangeRates.id, existing.id));
          result.updated++;
        } else {
          await db.insert(exchangeRates).values(rate);
          result.inserted++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to save ${rate.fromCurrency}->${rate.toCurrency}: ${message}`);
      }
    }

    result.success = result.errors.length === 0;
    await updateDataSourceSyncTime();

    console.log(`✅ Exchange rate sync complete: ${result.inserted} inserted, ${result.updated} updated`);
    
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(message);
    console.error('❌ Exchange rate sync failed:', message);
    return result;
  }
}

/**
 * Get exchange rate for a specific currency pair
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  maxAgeHours: number = 24
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1;

  const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const cached = await db.query.exchangeRates.findFirst({
    where: and(
      eq(exchangeRates.fromCurrency, fromCurrency),
      eq(exchangeRates.toCurrency, toCurrency),
      gte(exchangeRates.date, maxAge)
    ),
    orderBy: [desc(exchangeRates.date)],
  });

  if (cached) {
    return cached.rate;
  }

  try {
    const rate = await frankfurter.getRate(fromCurrency, toCurrency);

    if (rate) {
      await db.insert(exchangeRates).values({
        fromCurrency,
        toCurrency,
        rate,
        date: new Date(),
        source: 'frankfurter',
      }).onConflictDoNothing();

      return rate;
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
  }

  return null;
}

/**
 * Schedule daily exchange rate sync
 */
export function scheduleExchangeRateSync(): void {
  shouldSync().then(needsSync => {
    if (needsSync) {
      console.log('🔄 Running scheduled exchange rate sync...');
      syncExchangeRates().catch(console.error);
    }
  });

  setInterval(() => {
    console.log('🔄 Running scheduled exchange rate sync...');
    syncExchangeRates().catch(console.error);
  }, 24 * 60 * 60 * 1000);
}

// Helper functions
async function updateDataSourceSyncTime() {
  try {
    await db.update(dataSources)
      .set({ lastSyncAt: new Date() })
      .where(eq(dataSources.provider, 'frankfurter'));
  } catch (error) {
    // Ignore
  }
}

async function shouldSync(): Promise<boolean> {
  try {
    const source = await db.query.dataSources.findFirst({
      where: eq(dataSources.provider, 'frankfurter'),
    });

    if (!source?.lastSyncAt) return true;

    const hoursSinceSync = (Date.now() - source.lastSyncAt.getTime()) / (60 * 60 * 1000);
    return hoursSinceSync > 24;
  } catch {
    return true;
  }
}
