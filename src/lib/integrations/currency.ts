/**
 * Currency Conversion Utilities
 * Combines multiple exchange rate sources with caching and fallbacks
 * Primary: Frankfurter (ECB rates)
 * Fallbacks: Built-in rates for common conversions
 */

import {
  FrankfurterClient,
  getFrankfurterClient,
  frankfurter,
  FrankfurterError,
} from './frankfurter';

// ============================================================================
// Constants
// ============================================================================

// Built-in fallback rates (approximate, updated periodically)
// These are used when APIs are unavailable
const FALLBACK_RATES: Record<string, number> = {
  // Base: USD
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.5,
  AUD: 1.52,
  CAD: 1.35,
  CHF: 0.88,
  CNY: 7.19,
  HKD: 7.82,
  NZD: 1.61,
  SEK: 10.35,
  KRW: 1330,
  SGD: 1.34,
  NOK: 10.52,
  MXN: 17.05,
  INR: 83.0,
  RUB: 91.5,
  ZAR: 19.1,
  TRY: 30.5,
  BRL: 4.95,
  TWD: 31.3,
  DKK: 6.89,
  PLN: 4.0,
  THB: 35.5,
  IDR: 15600,
  HUF: 358,
  CZK: 23.4,
  ILS: 3.65,
  CLP: 965,
  PHP: 56.0,
  AED: 3.67,
  COP: 3910,
  SAR: 3.75,
  MYR: 4.75,
  RON: 4.6,
  // Cryptocurrencies (approximate USD rates)
  BTC: 0.000019, // ~$52,500
  ETH: 0.00034, // ~$2,900
  XRP: 1.85, // ~$0.54
  // Precious metals (USD per oz)
  XAU: 0.00047, // ~$2,100 gold
  XAG: 0.037, // ~$27 silver
};

// Common currency symbols for display
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  CNY: '¥',
  HKD: 'HK$',
  NZD: 'NZ$',
  SEK: 'kr',
  KRW: '₩',
  SGD: 'S$',
  NOK: 'kr',
  MXN: '$',
  INR: '₹',
  RUB: '₽',
  ZAR: 'R',
  TRY: '₺',
  BRL: 'R$',
  TWD: 'NT$',
  DKK: 'kr',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  HUF: 'Ft',
  CZK: 'Kč',
  ILS: '₪',
  CLP: '$',
  PHP: '₱',
  AED: 'د.إ',
  COP: '$',
  SAR: '﷼',
  MYR: 'RM',
  RON: 'lei',
  BTC: '₿',
  ETH: 'Ξ',
  XRP: 'XRP',
  XAU: 'XAU',
  XAG: 'XAG',
};

// Currency names for display
export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  HKD: 'Hong Kong Dollar',
  NZD: 'New Zealand Dollar',
  SEK: 'Swedish Krona',
  KRW: 'South Korean Won',
  SGD: 'Singapore Dollar',
  NOK: 'Norwegian Krone',
  MXN: 'Mexican Peso',
  INR: 'Indian Rupee',
  RUB: 'Russian Ruble',
  ZAR: 'South African Rand',
  TRY: 'Turkish Lira',
  BRL: 'Brazilian Real',
  TWD: 'Taiwan Dollar',
  DKK: 'Danish Krone',
  PLN: 'Polish Zloty',
  THB: 'Thai Baht',
  IDR: 'Indonesian Rupiah',
  HUF: 'Hungarian Forint',
  CZK: 'Czech Koruna',
  ILS: 'Israeli Shekel',
  CLP: 'Chilean Peso',
  PHP: 'Philippine Peso',
  AED: 'UAE Dirham',
  COP: 'Colombian Peso',
  SAR: 'Saudi Riyal',
  MYR: 'Malaysian Ringgit',
  RON: 'Romanian Leu',
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  XRP: 'Ripple',
  XAU: 'Gold (troy ounce)',
  XAG: 'Silver (troy ounce)',
};

// Cache TTL in milliseconds
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ============================================================================
// Types
// ============================================================================

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  inverseRate: number;
  timestamp: Date;
  source: 'api' | 'cache' | 'fallback';
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  isCrypto?: boolean;
  isMetal?: boolean;
}

export interface ExchangeRateEntry {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

// ============================================================================
// Cache Implementation
// ============================================================================

class CurrencyCache {
  private rates: Map<string, ExchangeRateEntry> = new Map();

  private getKey(from: string, to: string): string {
    return `${from.toUpperCase()}:${to.toUpperCase()}`;
  }

  get(from: string, to: string): ExchangeRateEntry | null {
    const key = this.getKey(from, to);
    const entry = this.rates.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp.getTime() > CACHE_TTL_MS;
    if (isExpired) {
      this.rates.delete(key);
      return null;
    }

    return entry;
  }

  set(from: string, to: string, rate: number): void {
    const key = this.getKey(from, to);
    this.rates.set(key, {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate,
      timestamp: new Date(),
    });

    // Also store inverse
    const inverseKey = this.getKey(to, from);
    this.rates.set(inverseKey, {
      from: to.toUpperCase(),
      to: from.toUpperCase(),
      rate: 1 / rate,
      timestamp: new Date(),
    });
  }

  setMultiple(
    base: string,
    rates: Record<string, number>
  ): void {
    for (const [currency, rate] of Object.entries(rates)) {
      this.set(base, currency, rate);
    }
  }

  clear(): void {
    this.rates.clear();
  }

  getAll(): ExchangeRateEntry[] {
    return Array.from(this.rates.values());
  }
}

// ============================================================================
// Currency Converter Class
// ============================================================================

export class CurrencyConverter {
  private readonly cache: CurrencyCache;
  private frankfurterClient: FrankfurterClient;

  constructor() {
    this.cache = new CurrencyCache();
    this.frankfurterClient = getFrankfurterClient();
  }

  /**
   * Convert amount from one currency to another
   * @param amount - Amount to convert
   * @param from - Source currency code
   * @param to - Target currency code
   */
  async convert(
    amount: number,
    from: string,
    to: string
  ): Promise<ConversionResult> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    // Same currency, no conversion needed
    if (fromUpper === toUpper) {
      return {
        from: fromUpper,
        to: toUpper,
        amount,
        convertedAmount: amount,
        rate: 1,
        inverseRate: 1,
        timestamp: new Date(),
        source: 'cache',
      };
    }

    // Check cache first
    const cached = this.cache.get(fromUpper, toUpper);
    if (cached) {
      return {
        from: fromUpper,
        to: toUpper,
        amount,
        convertedAmount: amount * cached.rate,
        rate: cached.rate,
        inverseRate: 1 / cached.rate,
        timestamp: cached.timestamp,
        source: 'cache',
      };
    }

    // Try to get rate from API
    try {
      const rate = await this.getRate(fromUpper, toUpper);
      return {
        from: fromUpper,
        to: toUpper,
        amount,
        convertedAmount: amount * rate,
        rate,
        inverseRate: 1 / rate,
        timestamp: new Date(),
        source: 'api',
      };
    } catch (error) {
      // Fall back to built-in rates
      const fallbackRate = this.getFallbackRate(fromUpper, toUpper);
      if (fallbackRate) {
        return {
          from: fromUpper,
          to: toUpper,
          amount,
          convertedAmount: amount * fallbackRate,
          rate: fallbackRate,
          inverseRate: 1 / fallbackRate,
          timestamp: new Date(),
          source: 'fallback',
        };
      }

      throw new Error(
        `Unable to convert ${fromUpper} to ${toUpper}: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get exchange rate between two currencies
   * @param from - Source currency
   * @param to - Target currency
   */
  async getRate(from: string, to: string): Promise<number> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) return 1;

    // Check cache
    const cached = this.cache.get(fromUpper, toUpper);
    if (cached) return cached.rate;

    // Try Frankfurter API for fiat currencies
    if (this.isFiatCurrency(fromUpper) && this.isFiatCurrency(toUpper)) {
      try {
        const rates = await this.frankfurterClient.getLatestRates(fromUpper, [
          toUpper,
        ]);
        const rate = rates.rates[toUpper];
        if (rate) {
          this.cache.set(fromUpper, toUpper, rate);
          return rate;
        }
      } catch (error) {
        if (error instanceof FrankfurterError) {
          // Try fallback
          const fallbackRate = this.getFallbackRate(fromUpper, toUpper);
          if (fallbackRate) return fallbackRate;
        }
        throw error;
      }
    }

    // Try fallback rates
    const fallbackRate = this.getFallbackRate(fromUpper, toUpper);
    if (fallbackRate) return fallbackRate;

    throw new Error(`Exchange rate not available for ${fromUpper} to ${toUpper}`);
  }

  /**
   * Get rates for multiple target currencies at once
   * @param from - Source currency
   * @param targets - Target currencies
   */
  async getMultipleRates(
    from: string,
    targets: string[]
  ): Promise<Record<string, number>> {
    const fromUpper = from.toUpperCase();
    const results: Record<string, number> = {};
    const uncached: string[] = [];

    // Check cache first
    for (const target of targets) {
      const targetUpper = target.toUpperCase();
      const cached = this.cache.get(fromUpper, targetUpper);
      if (cached) {
        results[targetUpper] = cached.rate;
      } else {
        uncached.push(targetUpper);
      }
    }

    if (uncached.length === 0) return results;

    // Fetch uncached rates
    try {
      const apiRates = await this.frankfurterClient.getLatestRates(
        fromUpper,
        uncached
      );

      for (const [currency, rate] of Object.entries(apiRates.rates)) {
        results[currency] = rate;
        this.cache.set(fromUpper, currency, rate);
      }
    } catch {
      // Use fallback rates for remaining
      for (const target of uncached) {
        const fallbackRate = this.getFallbackRate(fromUpper, target);
        if (fallbackRate) {
          results[target] = fallbackRate;
        }
      }
    }

    return results;
  }

  /**
   * Format amount with currency symbol
   * @param amount - Amount to format
   * @param currency - Currency code
   * @param locale - Locale for number formatting
   */
  formatAmount(
    amount: number,
    currency: string,
    locale: string = 'en-US'
  ): string {
    const code = currency.toUpperCase();
    const symbol = CURRENCY_SYMBOLS[code] || code;

    try {
      // Try Intl.NumberFormat for proper localization
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'symbol',
      });
      return formatter.format(amount);
    } catch {
      // Fallback formatting
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return `${symbol}${formatted}`;
    }
  }

  /**
   * Get currency information
   * @param code - Currency code
   */
  getCurrencyInfo(code: string): CurrencyInfo {
    const upperCode = code.toUpperCase();
    return {
      code: upperCode,
      name: CURRENCY_NAMES[upperCode] || upperCode,
      symbol: CURRENCY_SYMBOLS[upperCode] || upperCode,
      isCrypto: ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK'].includes(
        upperCode
      ),
      isMetal: ['XAU', 'XAG', 'XPT', 'XPD'].includes(upperCode),
    };
  }

  /**
   * Get all supported currencies
   */
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const currencies = await this.frankfurterClient.getCurrencies();
      return Object.keys(currencies);
    } catch {
      // Return fallback currency list
      return Object.keys(FALLBACK_RATES);
    }
  }

  /**
   * Check if currency is supported
   * @param code - Currency code
   */
  isSupported(code: string): boolean {
    const upperCode = code.toUpperCase();
    return (
      upperCode in FALLBACK_RATES || this.isFiatCurrency(upperCode)
    );
  }

  /**
   * Clear the rate cache
   */
  clearCache(): void {
    this.cache.clear();
    this.frankfurterClient.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ from: string; to: string; age: number }>;
  } {
    const entries = this.cache.getAll().map((entry) => ({
      from: entry.from,
      to: entry.to,
      age: Date.now() - entry.timestamp.getTime(),
    }));

    return {
      size: entries.length,
      entries,
    };
  }

  /**
   * Health check for all currency data sources
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    frankfurter: { healthy: boolean; latencyMs: number; error?: string };
    cacheSize: number;
  }> {
    const frankfurterHealth = await this.frankfurterClient.healthCheck();

    return {
      healthy: frankfurterHealth.healthy,
      frankfurter: frankfurterHealth,
      cacheSize: this.cache.getAll().length,
    };
  }

  // Private helpers
  private isFiatCurrency(code: string): boolean {
    // Fiat currencies are typically 3-letter codes except crypto/metal codes
    const cryptoAndMetals = [
      'BTC',
      'ETH',
      'XRP',
      'LTC',
      'BCH',
      'ADA',
      'DOT',
      'LINK',
      'XAU',
      'XAG',
      'XPT',
      'XPD',
    ];
    return !cryptoAndMetals.includes(code.toUpperCase());
  }

  private getFallbackRate(from: string, to: string): number | null {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    const fromRate = FALLBACK_RATES[fromUpper];
    const toRate = FALLBACK_RATES[toUpper];

    if (!fromRate || !toRate) return null;

    // Convert via USD base
    return toRate / fromRate;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let converterInstance: CurrencyConverter | null = null;

export function getCurrencyConverter(): CurrencyConverter {
  if (!converterInstance) {
    converterInstance = new CurrencyConverter();
  }
  return converterInstance;
}

// Export individual methods for convenience
export const currency = {
  convert: (amount: number, from: string, to: string) =>
    getCurrencyConverter().convert(amount, from, to),
  getRate: (from: string, to: string) =>
    getCurrencyConverter().getRate(from, to),
  getMultipleRates: (from: string, targets: string[]) =>
    getCurrencyConverter().getMultipleRates(from, targets),
  formatAmount: (amount: number, currency: string, locale?: string) =>
    getCurrencyConverter().formatAmount(amount, currency, locale),
  getCurrencyInfo: (code: string) =>
    getCurrencyConverter().getCurrencyInfo(code),
  getSupportedCurrencies: () => getCurrencyConverter().getSupportedCurrencies(),
  isSupported: (code: string) => getCurrencyConverter().isSupported(code),
  clearCache: () => getCurrencyConverter().clearCache(),
  getCacheStats: () => getCurrencyConverter().getCacheStats(),
  healthCheck: () => getCurrencyConverter().healthCheck(),
};

// Re-export types from other modules for convenience
export type {
  FrankfurterCurrencies,
  FrankfurterRate,
  FrankfurterConversion,
} from './frankfurter';
