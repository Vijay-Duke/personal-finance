/**
 * Frankfurter API Client
 * Free, no API key required
 * European Central Bank (ECB) exchange rates
 * https://www.frankfurter.app/docs/
 */

// ============================================================================
// Constants
// ============================================================================

const FRANKFURTER_API_BASE_URL = 'https://api.frankfurter.app';

// ECB rates are typically updated once per working day at 16:00 CET
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface FrankfurterCurrencies {
  [code: string]: string;
}

export interface FrankfurterRate {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface FrankfurterTimeSeries {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

export interface FrankfurterConversion {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface FrankfurterConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ConversionOptions {
  from: string;
  to: string | string[];
  amount?: number;
  date?: Date;
}

export interface TimeSeriesOptions {
  from: string;
  to?: string | string[];
  startDate: Date;
  endDate?: Date;
}

// ============================================================================
// Error Handling
// ============================================================================

export class FrankfurterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'FrankfurterError';
  }
}

export class FrankfurterCurrencyNotFoundError extends FrankfurterError {
  constructor(currency: string) {
    super(`Currency not found or not supported: ${currency}`, 404);
    this.name = 'FrankfurterCurrencyNotFoundError';
  }
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class FrankfurterCache {
  private ratesCache: Map<string, CacheEntry<FrankfurterRate>> = new Map();
  private currenciesCache: CacheEntry<FrankfurterCurrencies> | null = null;

  private getCacheKey(base: string, symbols?: string[]): string {
    return symbols?.length ? `${base}:${symbols.sort().join(',')}` : base;
  }

  getRates(base: string, symbols?: string[]): FrankfurterRate | null {
    const key = this.getCacheKey(base, symbols);
    const entry = this.ratesCache.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
    if (isExpired) {
      this.ratesCache.delete(key);
      return null;
    }

    return entry.data;
  }

  setRates(base: string, symbols: string[] | undefined, data: FrankfurterRate): void {
    const key = this.getCacheKey(base, symbols);
    this.ratesCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getCurrencies(): FrankfurterCurrencies | null {
    if (!this.currenciesCache) return null;

    const isExpired = Date.now() - this.currenciesCache.timestamp > CACHE_TTL_MS;
    if (isExpired) {
      this.currenciesCache = null;
      return null;
    }

    return this.currenciesCache.data;
  }

  setCurrencies(data: FrankfurterCurrencies): void {
    this.currenciesCache = {
      data,
      timestamp: Date.now(),
    };
  }

  clear(): void {
    this.ratesCache.clear();
    this.currenciesCache = null;
  }
}

// ============================================================================
// Client Implementation
// ============================================================================

export class FrankfurterClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly cache: FrankfurterCache;

  constructor(config: FrankfurterConfig = {}) {
    this.baseUrl = config.baseUrl ?? FRANKFURTER_API_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? 10000;
    this.cache = new FrankfurterCache();
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');

      if (response.status === 404) {
        throw new FrankfurterCurrencyNotFoundError(errorText);
      }

      throw new FrankfurterError(
        `Frankfurter API error: ${response.status} - ${errorText}`,
        response.status
      );
    }

    const data = (await response.json()) as T;
    return data;
  }

  /**
   * Get list of all available currencies
   * Returns cached data if available and not expired
   */
  async getCurrencies(): Promise<FrankfurterCurrencies> {
    const cached = this.cache.getCurrencies();
    if (cached) return cached;

    const url = `${this.baseUrl}/currencies`;
    const response = await this.fetchWithTimeout(url);
    const data = await this.handleResponse<FrankfurterCurrencies>(response);

    this.cache.setCurrencies(data);
    return data;
  }

  /**
   * Get latest exchange rates
   * @param base - Base currency code (e.g., 'EUR')
   * @param symbols - Target currency codes (e.g., ['USD', 'GBP'])
   */
  async getLatestRates(
    base: string = 'EUR',
    symbols?: string[]
  ): Promise<FrankfurterRate> {
    const cached = this.cache.getRates(base, symbols);
    if (cached) return cached;

    const params = new URLSearchParams();
    params.set('from', base.toUpperCase());
    if (symbols?.length) {
      params.set('to', symbols.map((s) => s.toUpperCase()).join(','));
    }

    const url = `${this.baseUrl}/latest?${params}`;
    const response = await this.fetchWithTimeout(url);
    const data = await this.handleResponse<FrankfurterRate>(response);

    this.cache.setRates(base, symbols, data);
    return data;
  }

  /**
   * Get historical rates for a specific date
   * @param date - Date to get rates for
   * @param base - Base currency code
   * @param symbols - Target currency codes
   */
  async getHistoricalRates(
    date: Date,
    base: string = 'EUR',
    symbols?: string[]
  ): Promise<FrankfurterRate> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const params = new URLSearchParams();
    params.set('from', base.toUpperCase());
    if (symbols?.length) {
      params.set('to', symbols.map((s) => s.toUpperCase()).join(','));
    }

    const url = `${this.baseUrl}/${dateStr}?${params}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<FrankfurterRate>(response);
  }

  /**
   * Get time series data for a date range
   * @param options - Time series options
   */
  async getTimeSeries(options: TimeSeriesOptions): Promise<FrankfurterTimeSeries> {
    const { from, to, startDate, endDate } = options;

    const params = new URLSearchParams();
    params.set('from', from.toUpperCase());
    if (to) {
      const targets = Array.isArray(to) ? to : [to];
      params.set('to', targets.map((s) => s.toUpperCase()).join(','));
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate?.toISOString().split('T')[0] || startStr;

    const url = `${this.baseUrl}/${startStr}..${endStr}?${params}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<FrankfurterTimeSeries>(response);
  }

  /**
   * Convert amount between currencies
   * @param options - Conversion options
   * @returns Conversion result with converted amount(s)
   */
  async convert(options: ConversionOptions): Promise<FrankfurterConversion> {
    const { from, to, amount = 1, date } = options;

    const targets = Array.isArray(to) ? to : [to];

    const params = new URLSearchParams();
    params.set('from', from.toUpperCase());
    params.set('to', targets.map((s) => s.toUpperCase()).join(','));
    params.set('amount', amount.toString());

    let url: string;
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      url = `${this.baseUrl}/${dateStr}?${params}`;
    } else {
      url = `${this.baseUrl}/latest?${params}`;
    }

    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<FrankfurterConversion>(response);
  }

  /**
   * Get exchange rate between two currencies
   * Convenience method for single rate lookup
   * @param from - Source currency
   * @param to - Target currency
   * @param date - Optional historical date
   */
  async getRate(
    from: string,
    to: string,
    date?: Date
  ): Promise<number> {
    const result = date
      ? await this.getHistoricalRates(date, from, [to])
      : await this.getLatestRates(from, [to]);

    const rate = result.rates[to.toUpperCase()];
    if (rate === undefined) {
      throw new FrankfurterCurrencyNotFoundError(to);
    }

    return rate;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Health check - verifies API connectivity
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latencyMs: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/latest?from=EUR&to=USD`;
      const response = await this.fetchWithTimeout(url);

      if (response.ok) {
        return {
          healthy: true,
          latencyMs: Date.now() - startTime,
        };
      }

      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let clientInstance: FrankfurterClient | null = null;

export function getFrankfurterClient(
  config?: FrankfurterConfig
): FrankfurterClient {
  if (!clientInstance || config) {
    clientInstance = new FrankfurterClient(config);
  }
  return clientInstance;
}

// Export individual methods for convenience
export const frankfurter = {
  getCurrencies: () => getFrankfurterClient().getCurrencies(),
  getLatestRates: (base?: string, symbols?: string[]) =>
    getFrankfurterClient().getLatestRates(base, symbols),
  getHistoricalRates: (date: Date, base?: string, symbols?: string[]) =>
    getFrankfurterClient().getHistoricalRates(date, base, symbols),
  getTimeSeries: (options: TimeSeriesOptions) =>
    getFrankfurterClient().getTimeSeries(options),
  convert: (options: ConversionOptions) =>
    getFrankfurterClient().convert(options),
  getRate: (from: string, to: string, date?: Date) =>
    getFrankfurterClient().getRate(from, to, date),
  clearCache: () => getFrankfurterClient().clearCache(),
  healthCheck: () => getFrankfurterClient().healthCheck(),
};
