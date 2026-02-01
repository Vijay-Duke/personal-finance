/**
 * External Integration Mocks
 * Mock implementations for external APIs
 */

import { vi } from 'vitest';

// CoinGecko mocks
export const mockCoinGecko = {
  fetchCryptoPrices: vi.fn().mockResolvedValue(new Map([
    ['BTC', { symbol: 'BTC', name: 'Bitcoin', currentPrice: 50000, priceChange24h: 1000, priceChangePercentage24h: 2, marketCap: 1000000000000, lastUpdated: new Date() }],
    ['ETH', { symbol: 'ETH', name: 'Ethereum', currentPrice: 3000, priceChange24h: 50, priceChangePercentage24h: 1.7, marketCap: 360000000000, lastUpdated: new Date() }],
  ])),
  fetchCryptoPrice: vi.fn().mockResolvedValue({
    symbol: 'BTC',
    name: 'Bitcoin',
    currentPrice: 50000,
    priceChange24h: 1000,
    priceChangePercentage24h: 2,
    marketCap: 1000000000000,
    lastUpdated: new Date(),
  }),
  searchCoins: vi.fn().mockResolvedValue([
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  ]),
  checkCoinGeckoHealth: vi.fn().mockResolvedValue({ healthy: true, rateLimitRemaining: 25 }),
};

// Yahoo Finance mocks
export const mockYahooFinance = {
  fetchStockQuotes: vi.fn().mockResolvedValue(new Map([
    ['AAPL', { symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', currentPrice: 180, previousClose: 178, change: 2, changePercent: 1.12, dayHigh: 182, dayLow: 179, volume: 50000000, fiftyTwoWeekHigh: 198, fiftyTwoWeekLow: 165, lastUpdated: new Date() }],
  ])),
  fetchStockQuote: vi.fn().mockResolvedValue({
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currency: 'USD',
    currentPrice: 180,
    previousClose: 178,
    change: 2,
    changePercent: 1.12,
    dayHigh: 182,
    dayLow: 179,
    volume: 50000000,
    fiftyTwoWeekHigh: 198,
    fiftyTwoWeekLow: 165,
    lastUpdated: new Date(),
  }),
  searchStocks: vi.fn().mockResolvedValue([
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  ]),
  isMarketOpen: vi.fn().mockReturnValue(false),
  getNextMarketOpen: vi.fn().mockReturnValue(new Date()),
};

// Frankfurter mocks
export const mockFrankfurter = {
  fetchLatestRates: vi.fn().mockResolvedValue({
    base: 'USD',
    date: new Date().toISOString().split('T')[0],
    rates: { EUR: 0.85, GBP: 0.73, JPY: 110 },
  }),
  convertCurrency: vi.fn().mockResolvedValue(85),
  syncMajorCurrencyRates: vi.fn().mockResolvedValue([
    { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.85, date: new Date(), source: 'frankfurter' },
  ]),
  checkFrankfurterHealth: vi.fn().mockResolvedValue({ healthy: true }),
};

// Apply mocks
vi.mock('@/lib/integrations/coingecko', () => mockCoinGecko);
vi.mock('@/lib/integrations/yahoo-finance', () => mockYahooFinance);
vi.mock('@/lib/integrations/frankfurter', () => mockFrankfurter);
