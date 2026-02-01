/**
 * API Integrations Index
 * 
 * This module provides clients for external financial data APIs:
 * - CoinGecko: Cryptocurrency prices (free, no API key, 30 calls/min)
 * - Yahoo Finance: Stock/ETF prices (free, no API key)
 * - Frankfurter: Exchange rates from ECB (free, no API key)
 * - Metals.dev: Precious metals prices (free tier 50/day, requires API key)
 * - Currency: Conversion utilities with caching and fallbacks
 */

// CoinGecko - Crypto prices
export {
  CoinGeckoClient,
  getCoinGeckoClient,
  coinGecko,
  CoinGeckoError,
  CoinGeckoRateLimitError,
} from './coingecko';
export type {
  CoinGeckoPrice,
  CoinGeckoCoin,
  CoinGeckoMarketData,
  CoinGeckoConfig,
  PriceOptions,
} from './coingecko';

// Yahoo Finance - Stock prices
export {
  YahooFinanceClient,
  getYahooFinanceClient,
  yahooFinance,
  YahooFinanceError,
  YahooFinanceNotFoundError,
} from './yahoo-finance';
export type {
  YahooQuote,
  YahooChartMeta,
  YahooChartResult,
  YahooSearchResult,
  YahooFinanceConfig,
  ChartOptions,
  HistoricalDataPoint,
} from './yahoo-finance';

// Frankfurter - Exchange rates
export {
  FrankfurterClient,
  getFrankfurterClient,
  frankfurter,
  FrankfurterError,
  FrankfurterCurrencyNotFoundError,
} from './frankfurter';
export type {
  FrankfurterCurrencies,
  FrankfurterRate,
  FrankfurterTimeSeries,
  FrankfurterConversion,
  FrankfurterConfig,
  ConversionOptions,
  TimeSeriesOptions,
} from './frankfurter';

// Metals.dev - Precious metals
export {
  MetalsDevClient,
  getMetalsDevClient,
  initializeMetalsDev,
  metalsDev,
  MetalsDevError,
  MetalsDevAuthError,
  MetalsDevRateLimitError,
} from './metals-dev';
export type {
  MetalsDevPrice,
  MetalsDevMultiPrice,
  MetalsDevHistorical,
  MetalsDevSymbols,
  MetalType,
  WeightUnit,
  MetalsDevConfig,
  HistoricalOptions,
} from './metals-dev';

// Currency - Conversion utilities
export {
  CurrencyConverter,
  getCurrencyConverter,
  currency,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
} from './currency';
export type {
  ConversionResult,
  CurrencyInfo,
  ExchangeRateEntry,
} from './currency';
