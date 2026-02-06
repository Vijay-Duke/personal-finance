import type { APIRoute } from 'astro';
import { json, error } from '@/lib/api/response';

/**
 * GET /api/stocks/quote?symbol=AAPL
 * Get current stock quote
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol');

  if (!symbol) {
    return error('Symbol is required', 400);
  }

  const apiKey = import.meta.env.FINNHUB_API_KEY;

  // If no API key, return mock data
  if (!apiKey) {
    return getMockQuote(symbol);
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Finnhub API error');
    }

    const data = await response.json();

    // Finnhub returns 0 for all values if symbol not found
    if (data.c === 0 && data.pc === 0) {
      return getMockQuote(symbol);
    }

    return json({
      c: data.c,          // Current price
      d: data.d,          // Change
      dp: data.dp,        // Percent change
      h: data.h,          // High
      l: data.l,          // Low
      o: data.o,          // Open
      pc: data.pc,        // Previous close
    });
  } catch (err) {
    console.error('Stock quote error:', err);
    return getMockQuote(symbol);
  }
};

// Generate consistent mock quote based on symbol
function getMockQuote(symbol: string) {
  // Generate deterministic pseudo-random numbers based on symbol
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Base price between $50 and $500
  const basePrice = 50 + (hash % 450);

  // Random daily change between -5% and +5%
  const changePercent = ((hash % 100) - 50) / 10;
  const change = basePrice * (changePercent / 100);

  const currentPrice = basePrice;
  const previousClose = currentPrice - change;
  const open = previousClose * (1 + ((hash % 20) - 10) / 1000);
  const high = Math.max(currentPrice, open) * (1 + (hash % 5) / 1000);
  const low = Math.min(currentPrice, open) * (1 - (hash % 5) / 1000);

  return json({
    c: Number(currentPrice.toFixed(2)),
    d: Number(change.toFixed(2)),
    dp: Number(changePercent.toFixed(2)),
    h: Number(high.toFixed(2)),
    l: Number(low.toFixed(2)),
    o: Number(open.toFixed(2)),
    pc: Number(previousClose.toFixed(2)),
  });
}
