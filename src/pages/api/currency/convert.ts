import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized } from '../../../lib/api/response';
import { currency } from '../../../lib/integrations';

/**
 * POST /api/currency/convert
 * Convert an amount between currencies using cached rates.
 * Falls back to live API if rate not in cache.
 *
 * Request body:
 * - amount: number (required)
 * - from: Source currency code (required, e.g., 'USD')
 * - to: Target currency code (required, e.g., 'EUR')
 * - useCacheOnly: boolean (default: false) - Only use cached rates, don't fetch from API
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    // Validate required fields
    if (typeof body.amount !== 'number' || body.amount < 0) {
      return error('Valid amount is required');
    }
    if (!body.from || typeof body.from !== 'string') {
      return error('Source currency (from) is required');
    }
    if (!body.to || typeof body.to !== 'string') {
      return error('Target currency (to) is required');
    }

    const fromCurrency = body.from.toUpperCase();
    const toCurrency = body.to.toUpperCase();
    const useCacheOnly = body.useCacheOnly === true;

    // For cache-only mode, check if rate exists
    if (useCacheOnly) {
      const cacheStats = currency.getCacheStats();
      const cachedRate = cacheStats.entries.find(
        (e) => e.from === fromCurrency && e.to === toCurrency
      );

      if (!cachedRate) {
        return error(
          `No cached rate available for ${fromCurrency} to ${toCurrency}`,
          404
        );
      }
    }

    // Perform conversion
    const result = await currency.convert(body.amount, fromCurrency, toCurrency);

    return json({
      originalAmount: body.amount,
      from: result.from,
      to: result.to,
      convertedAmount: result.convertedAmount,
      rate: result.rate,
      inverseRate: result.inverseRate,
      source: result.source,
      timestamp: result.timestamp,
    });
  } catch (err) {
    console.error('Error converting currency:', err);
    if (err instanceof Error) {
      if (err.message.includes('not available') || err.message.includes('not supported')) {
        return error(err.message, 400);
      }
    }
    return error('Failed to convert currency', 500);
  }
};
