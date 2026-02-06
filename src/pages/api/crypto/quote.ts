import type { APIRoute } from 'astro';
import { json, error } from '@/lib/api/response';

/**
 * GET /api/crypto/quote?id=bitcoin
 * Get current crypto price
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return error('Crypto ID is required', 400);
  }

  // Return mock price data
  return getMockQuote(id);
};

// Generate consistent mock price based on crypto id
function getMockQuote(id: string) {
  const prices: Record<string, number> = {
    bitcoin: 67234.52,
    ethereum: 3456.78,
    tether: 1.0,
    binancecoin: 567.89,
    solana: 145.23,
    ripple: 0.62,
    'usd-coin': 1.0,
    cardano: 0.45,
    dogecoin: 0.12,
    'avalanche-2': 35.67,
    tron: 0.13,
    chainlink: 18.45,
    polkadot: 7.23,
    polygon: 0.67,
    litecoin: 78.90,
    'shiba-inu': 0.000018,
    'bitcoin-cash': 345.67,
    uniswap: 9.87,
    stellar: 0.11,
    monero: 145.67,
    cosmos: 8.90,
    filecoin: 6.78,
    aptos: 8.45,
    arbitrum: 1.23,
    optimism: 2.34,
    near: 5.67,
    aave: 98.76,
    sui: 1.45,
  };

  const basePrice = prices[id.toLowerCase()] || 10.0;

  // Generate small random variation
  const variation = (Math.random() - 0.5) * 0.02; // ±1%
  const currentPrice = basePrice * (1 + variation);
  const previousPrice = basePrice * (1 - variation);
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;

  return json({
    currentPrice: Number(currentPrice.toFixed(currentPrice < 1 ? 6 : 2)),
    change: Number(change.toFixed(currentPrice < 1 ? 6 : 2)),
    changePercent: Number(changePercent.toFixed(2)),
  });
}
