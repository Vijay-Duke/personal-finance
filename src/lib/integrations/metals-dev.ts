/**
 * Metals.dev API Client
 * Free tier: 50 requests/day, requires API key
 * Precious metals prices (Gold, Silver, Platinum, Palladium)
 * https://metals.dev/docs
 */

// ============================================================================
// Constants
// ============================================================================

const METALS_DEV_API_BASE_URL = 'https://metals.dev';

// Free tier: 50 requests/day
const MIN_REQUEST_INTERVAL_MS = 1800000; // 30 minutes between requests

let lastRequestTime = 0;

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface MetalsDevPrice {
  metal: 'gold' | 'silver' | 'platinum' | 'palladium';
  currency: string;
  unit: 'oz' | 'g' | 'kg' | 'lb';
  price: number;
  ask?: number;
  bid?: number;
  change?: number;
  change_percent?: number;
  timestamp: number;
}

export interface MetalsDevMultiPrice {
  timestamp: number;
  metals: Record<string, {
    price: number;
    ask?: number;
    bid?: number;
    change?: number;
    change_percent?: number;
  }>;
}

export interface MetalsDevHistorical {
  metal: string;
  currency: string;
  unit: string;
  data: Array<{
    date: string;
    price: number;
  }>;
}

export interface MetalsDevSymbols {
  metals: Array<{
    symbol: string;
    name: string;
    unit: string;
  }>;
  currencies: string[];
}

export type MetalType = 'gold' | 'silver' | 'platinum' | 'palladium';
export type WeightUnit = 'oz' | 'g' | 'kg' | 'lb';

export interface MetalsDevConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface HistoricalOptions {
  metal: MetalType;
  currency?: string;
  unit?: WeightUnit;
  startDate: Date;
  endDate?: Date;
  days?: number;
}

// ============================================================================
// Error Handling
// ============================================================================

export class MetalsDevError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'MetalsDevError';
  }
}

export class MetalsDevAuthError extends MetalsDevError {
  constructor(message: string = 'Invalid or missing API key') {
    super(message, 401);
    this.name = 'MetalsDevAuthError';
  }
}

export class MetalsDevRateLimitError extends MetalsDevError {
  constructor(
    message: string = 'Daily rate limit exceeded. Free tier allows 50 requests/day.',
    public readonly retryAfterMs?: number
  ) {
    super(message, 429);
    this.name = 'MetalsDevRateLimitError';
  }
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MetalsDevCache {
  private cache: Map<string, CacheEntry<MetalsDevPrice>> = new Map();
  private readonly ttlMs: number = 5 * 60 * 1000; // 5 minutes default

  private getKey(metal: string, currency: string, unit: string): string {
    return `${metal}:${currency}:${unit}`;
  }

  get(metal: string, currency: string, unit: string): MetalsDevPrice | null {
    const key = this.getKey(metal, currency, unit);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(metal: string, currency: string, unit: string, data: MetalsDevPrice): void {
    const key = this.getKey(metal, currency, unit);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Client Implementation
// ============================================================================

export class MetalsDevClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly cache: MetalsDevCache;

  constructor(config: MetalsDevConfig) {
    if (!config.apiKey) {
      throw new MetalsDevAuthError('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? METALS_DEV_API_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? 10000;
    this.cache = new MetalsDevCache();
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
      const delay = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    lastRequestTime = Date.now();
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
    if (response.status === 401) {
      throw new MetalsDevAuthError();
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new MetalsDevRateLimitError(
        undefined,
        retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new MetalsDevError(
        `Metals.dev API error: ${response.status} - ${errorText}`,
        response.status
      );
    }

    const data = (await response.json()) as T;
    return data;
  }

  /**
   * Get current price for a single metal
   * @param metal - Metal type (gold, silver, platinum, palladium)
   * @param currency - Currency code (default: USD)
   * @param unit - Weight unit (default: oz)
   */
  async getPrice(
    metal: MetalType,
    currency: string = 'USD',
    unit: WeightUnit = 'oz'
  ): Promise<MetalsDevPrice> {
    // Check cache first
    const cached = this.cache.get(metal, currency, unit);
    if (cached) return cached;

    await this.rateLimit();

    const params = new URLSearchParams({
      api_key: this.apiKey,
      metal,
      currency: currency.toUpperCase(),
      unit,
    });

    const url = `${this.baseUrl}/price?${params}`;
    const response = await this.fetchWithTimeout(url);
    const data = await this.handleResponse<MetalsDevPrice>(response);

    this.cache.set(metal, currency, unit, data);
    return data;
  }

  /**
   * Get prices for multiple metals at once
   * @param metals - Array of metal types
   * @param currency - Currency code
   * @param unit - Weight unit
   */
  async getMultiplePrices(
    metals: MetalType[],
    currency: string = 'USD',
    unit: WeightUnit = 'oz'
  ): Promise<MetalsDevMultiPrice> {
    await this.rateLimit();

    const params = new URLSearchParams({
      api_key: this.apiKey,
      metal: metals.join(','),
      currency: currency.toUpperCase(),
      unit,
    });

    const url = `${this.baseUrl}/price?${params}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<MetalsDevMultiPrice>(response);
  }

  /**
   * Get historical price data
   * @param options - Historical data options
   */
  async getHistorical(options: HistoricalOptions): Promise<MetalsDevHistorical> {
    await this.rateLimit();

    const {
      metal,
      currency = 'USD',
      unit = 'oz',
      startDate,
      endDate,
      days,
    } = options;

    const params = new URLSearchParams({
      api_key: this.apiKey,
      metal,
      currency: currency.toUpperCase(),
      unit,
    });

    if (days) {
      params.set('days', days.toString());
    } else {
      params.set('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) {
        params.set('end_date', endDate.toISOString().split('T')[0]);
      }
    }

    const url = `${this.baseUrl}/historical?${params}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<MetalsDevHistorical>(response);
  }

  /**
   * Get available symbols (metals and currencies)
   */
  async getSymbols(): Promise<MetalsDevSymbols> {
    await this.rateLimit();

    const params = new URLSearchParams({
      api_key: this.apiKey,
    });

    const url = `${this.baseUrl}/symbols?${params}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<MetalsDevSymbols>(response);
  }

  /**
   * Get all precious metal prices in USD per ounce
   * Convenience method for common use case
   */
  async getAllMetals(): Promise<
    Record<MetalType, { price: number; change?: number; changePercent?: number }>
  > {
    const result = await this.getMultiplePrices(['gold', 'silver', 'platinum', 'palladium']);

    const metals: Record<
      MetalType,
      { price: number; change?: number; changePercent?: number }
    > = {
      gold: { price: 0 },
      silver: { price: 0 },
      platinum: { price: 0 },
      palladium: { price: 0 },
    };

    for (const [metal, data] of Object.entries(result.metals)) {
      if (metal in metals) {
        metals[metal as MetalType] = {
          price: data.price,
          change: data.change,
          changePercent: data.change_percent,
        };
      }
    }

    return metals;
  }

  /**
   * Convert metal weight between units
   * @param amount - Amount to convert
   * @param fromUnit - Source unit
   * @param toUnit - Target unit
   */
  convertWeight(
    amount: number,
    fromUnit: WeightUnit,
    toUnit: WeightUnit
  ): number {
    // Convert to grams first
    const toGrams: Record<WeightUnit, number> = {
      g: 1,
      oz: 31.1034768, // troy ounce
      kg: 1000,
      lb: 453.59237,
    };

    const grams = amount * toGrams[fromUnit];
    return grams / toGrams[toUnit];
  }

  /**
   * Calculate value of metal holding
   * @param metal - Metal type
   * @param weight - Weight amount
   * @param weightUnit - Weight unit
   * @param currency - Currency for value
   */
  async calculateValue(
    metal: MetalType,
    weight: number,
    weightUnit: WeightUnit = 'oz',
    currency: string = 'USD'
  ): Promise<{
    metal: MetalType;
    weight: number;
    weightUnit: WeightUnit;
    pricePerUnit: number;
    totalValue: number;
    currency: string;
  }> {
    const priceData = await this.getPrice(metal, currency, weightUnit);

    return {
      metal,
      weight,
      weightUnit,
      pricePerUnit: priceData.price,
      totalValue: weight * priceData.price,
      currency,
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Health check - verifies API connectivity and key validity
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latencyMs: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Use symbols endpoint as it's lightweight
      const params = new URLSearchParams({
        api_key: this.apiKey,
      });

      const url = `${this.baseUrl}/symbols?${params}`;
      const response = await this.fetchWithTimeout(url);

      if (response.ok) {
        return {
          healthy: true,
          latencyMs: Date.now() - startTime,
        };
      }

      if (response.status === 401) {
        return {
          healthy: false,
          latencyMs: Date.now() - startTime,
          error: 'Invalid API key',
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
// Singleton Export (requires API key)
// ============================================================================

let clientInstance: MetalsDevClient | null = null;

export function getMetalsDevClient(config?: MetalsDevConfig): MetalsDevClient {
  if (!clientInstance || config) {
    if (!config?.apiKey && !clientInstance) {
      throw new MetalsDevAuthError('API key is required to initialize Metals.dev client');
    }
    clientInstance = new MetalsDevClient(config!);
  }
  return clientInstance;
}

/**
 * Initialize the Metals.dev client with an API key
 * Must be called before using any other methods
 */
export function initializeMetalsDev(apiKey: string): void {
  clientInstance = new MetalsDevClient({ apiKey });
}

// Export individual methods for convenience (requires initialization first)
export const metalsDev = {
  getPrice: (metal: MetalType, currency?: string, unit?: WeightUnit) =>
    getMetalsDevClient().getPrice(metal, currency, unit),
  getMultiplePrices: (metals: MetalType[], currency?: string, unit?: WeightUnit) =>
    getMetalsDevClient().getMultiplePrices(metals, currency, unit),
  getHistorical: (options: HistoricalOptions) =>
    getMetalsDevClient().getHistorical(options),
  getSymbols: () => getMetalsDevClient().getSymbols(),
  getAllMetals: () => getMetalsDevClient().getAllMetals(),
  convertWeight: (
    amount: number,
    fromUnit: WeightUnit,
    toUnit: WeightUnit
  ) => getMetalsDevClient().convertWeight(amount, fromUnit, toUnit),
  calculateValue: (
    metal: MetalType,
    weight: number,
    weightUnit?: WeightUnit,
    currency?: string
  ) => getMetalsDevClient().calculateValue(metal, weight, weightUnit, currency),
  clearCache: () => getMetalsDevClient().clearCache(),
  healthCheck: () => getMetalsDevClient().healthCheck(),
};
