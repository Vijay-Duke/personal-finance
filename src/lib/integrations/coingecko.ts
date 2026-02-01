/**
 * CoinGecko API Client
 * Free tier: 30 calls/minute, no API key required
 * https://www.coingecko.com/en/api/documentation
 */

// ============================================================================
// Constants
// ============================================================================

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
const COINGECKO_PRO_API_BASE_URL = 'https://pro-api.coingecko.com/api/v3';

// Rate limiting: 30 calls/minute for free tier
const MIN_REQUEST_INTERVAL_MS = 2000; // 2 seconds between requests

let lastRequestTime = 0;

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
    last_updated_at?: number;
    [currency: string]: number | undefined;
  };
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string | null>;
}

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
}

export interface CoinGeckoConfig {
  apiKey?: string; // Optional for free tier
  baseUrl?: string;
  timeoutMs?: number;
}

export interface PriceOptions {
  includeMarketCap?: boolean;
  include24hVol?: boolean;
  include24hChange?: boolean;
  includeLastUpdatedAt?: boolean;
}

// ============================================================================
// Error Handling
// ============================================================================

export class CoinGeckoError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'CoinGeckoError';
  }
}

export class CoinGeckoRateLimitError extends CoinGeckoError {
  constructor(
    message: string = 'Rate limit exceeded. Please wait before making more requests.',
    public readonly retryAfterMs?: number
  ) {
    super(message, 429);
    this.name = 'CoinGeckoRateLimitError';
  }
}

// ============================================================================
// Client Implementation
// ============================================================================

export class CoinGeckoClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(config: CoinGeckoConfig = {}) {
    this.apiKey = config.apiKey;
    this.baseUrl =
      config.baseUrl ??
      (this.apiKey ? COINGECKO_PRO_API_BASE_URL : COINGECKO_API_BASE_URL);
    this.timeoutMs = config.timeoutMs ?? 10000;
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
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (this.apiKey) {
        headers['x-cg-pro-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new CoinGeckoRateLimitError(
        undefined,
        retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new CoinGeckoError(
        `CoinGecko API error: ${response.status} - ${errorText}`,
        response.status
      );
    }

    const data = (await response.json()) as T;
    return data;
  }

  /**
   * Get current price for one or more coins
   * @param ids - Coin IDs (e.g., 'bitcoin', 'ethereum')
   * @param currencies - Target currencies (e.g., 'usd', 'eur')
   * @param options - Additional data options
   */
  async getPrice(
    ids: string[],
    currencies: string[] = ['usd'],
    options: PriceOptions = {}
  ): Promise<CoinGeckoPrice> {
    await this.rateLimit();

    const params = new URLSearchParams({
      ids: ids.join(','),
      vs_currencies: currencies.join(','),
    });

    if (options.includeMarketCap) params.set('include_market_cap', 'true');
    if (options.include24hVol) params.set('include_24hr_vol', 'true');
    if (options.include24hChange) params.set('include_24hr_change', 'true');
    if (options.includeLastUpdatedAt) params.set('include_last_updated_at', 'true');

    const url = `${this.baseUrl}/simple/price?${params}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<CoinGeckoPrice>(response);
  }

  /**
   * Get list of all supported coins
   */
  async getCoinList(): Promise<CoinGeckoCoin[]> {
    await this.rateLimit();

    const url = `${this.baseUrl}/coins/list`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<CoinGeckoCoin[]>(response);
  }

  /**
   * Get market data for coins
   * @param vsCurrency - Target currency (e.g., 'usd')
   * @param coinIds - Optional filter by coin IDs
   * @param perPage - Number of results per page (1-250)
   * @param page - Page number
   */
  async getMarketData(
    vsCurrency: string = 'usd',
    coinIds?: string[],
    perPage: number = 100,
    page: number = 1
  ): Promise<CoinGeckoMarketData[]> {
    await this.rateLimit();

    const params = new URLSearchParams({
      vs_currency: vsCurrency,
      per_page: Math.min(Math.max(perPage, 1), 250).toString(),
      page: page.toString(),
      order: 'market_cap_desc',
      sparkline: 'false',
    });

    if (coinIds?.length) {
      params.set('ids', coinIds.join(','));
    }

    const url = `${this.baseUrl}/coins/markets?${params}`;
    const response = await this.fetchWithTimeout(url);
    return this.handleResponse<CoinGeckoMarketData[]>(response);
  }

  /**
   * Search for coins by keyword
   * Note: Uses the /search endpoint which has stricter rate limits
   */
  async search(query: string): Promise<CoinGeckoCoin[]> {
    await this.rateLimit();

    const params = new URLSearchParams({ q: query });
    const url = `${this.baseUrl}/search?${params}`;
    const response = await this.fetchWithTimeout(url);
    const data = await this.handleResponse<{ coins: CoinGeckoCoin[] }>(response);
    return data.coins;
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
      // Use a simple endpoint to check health
      const url = `${this.baseUrl}/ping`;
      const response = await this.fetchWithTimeout(url, { method: 'GET' });

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

let clientInstance: CoinGeckoClient | null = null;

export function getCoinGeckoClient(
  config?: CoinGeckoConfig
): CoinGeckoClient {
  if (!clientInstance || config) {
    clientInstance = new CoinGeckoClient(config);
  }
  return clientInstance;
}

// Export individual methods for convenience
export const coinGecko = {
  getPrice: (ids: string[], currencies?: string[], options?: PriceOptions) =>
    getCoinGeckoClient().getPrice(ids, currencies, options),
  getCoinList: () => getCoinGeckoClient().getCoinList(),
  getMarketData: (
    vsCurrency?: string,
    coinIds?: string[],
    perPage?: number,
    page?: number
  ) => getCoinGeckoClient().getMarketData(vsCurrency, coinIds, perPage, page),
  search: (query: string) => getCoinGeckoClient().search(query),
  healthCheck: () => getCoinGeckoClient().healthCheck(),
};
