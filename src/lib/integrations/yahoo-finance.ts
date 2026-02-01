/**
 * Yahoo Finance API Client
 * Free, no API key required
 * Uses Yahoo Finance query endpoints
 * https://finance.yahoo.com/
 */

// ============================================================================
// Constants
// ============================================================================

const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance';
const YAHOO_FINANCE_CHART_URL = 'https://query1.finance.yahoo.com/v11/finance';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice: number | null;
  regularMarketChange?: number | null;
  regularMarketChangePercent?: number | null;
  regularMarketOpen?: number | null;
  regularMarketDayHigh?: number | null;
  regularMarketDayLow?: number | null;
  regularMarketVolume?: number | null;
  marketCap?: number | null;
  trailingPE?: number | null;
  forwardPE?: number | null;
  dividendYield?: number | null;
  averageVolume?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  fiftyDayAverage?: number | null;
  twoHundredDayAverage?: number | null;
  currency?: string;
  exchange?: string;
  quoteType: 'EQUITY' | 'ETF' | 'CRYPTOCURRENCY' | 'CURRENCY' | 'FUTURE' | 'INDEX';
  marketState?: 'REGULAR' | 'PRE' | 'PREPRE' | 'POST' | 'CLOSED' | '';
  regularMarketTime?: number;
}

export interface YahooChartMeta {
  currency: string;
  symbol: string;
  exchangeName: string;
  fullExchangeName?: string;
  instrumentType: string;
  firstTradeDate?: number;
  regularMarketTime: number;
  gmtoffset: number;
  timezone: string;
  exchangeTimezoneName: string;
  regularMarketPrice: number;
  chartPreviousClose?: number;
  previousClose?: number;
  scale?: number;
  priceHint: number;
}

export interface YahooChartResult {
  meta: YahooChartMeta;
  timestamp?: number[];
  indicators: {
    quote: Array<{
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }>;
    adjclose?: Array<{
      adjclose?: (number | null)[];
    }>;
  };
}

export interface YahooSearchResult {
  symbol: string;
  name?: string;
  exch?: string;
  type?: string;
  exchDisp?: string;
  typeDisp?: string;
}

export interface YahooFinanceConfig {
  baseUrl?: string;
  chartUrl?: string;
  timeoutMs?: number;
}

export interface ChartOptions {
  interval?: '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo';
  range?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max';
  startDate?: Date;
  endDate?: Date;
}

export interface HistoricalDataPoint {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  adjustedClose: number | null;
}

// ============================================================================
// Error Handling
// ============================================================================

export class YahooFinanceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly symbol?: string
  ) {
    super(message);
    this.name = 'YahooFinanceError';
  }
}

export class YahooFinanceNotFoundError extends YahooFinanceError {
  constructor(symbol: string) {
    super(`Symbol not found: ${symbol}`, 404, symbol);
    this.name = 'YahooFinanceNotFoundError';
  }
}

// ============================================================================
// Client Implementation
// ============================================================================

export class YahooFinanceClient {
  private readonly baseUrl: string;
  private readonly chartUrl: string;
  private readonly timeoutMs: number;

  constructor(config: YahooFinanceConfig = {}) {
    this.baseUrl = config.baseUrl ?? YAHOO_FINANCE_BASE_URL;
    this.chartUrl = config.chartUrl ?? YAHOO_FINANCE_CHART_URL;
    this.timeoutMs = config.timeoutMs ?? 15000;
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
      if (response.status === 404) {
        throw new YahooFinanceNotFoundError('');
      }

      const errorText = await response.text().catch(() => 'Unknown error');
      throw new YahooFinanceError(
        `Yahoo Finance API error: ${response.status} - ${errorText}`,
        response.status
      );
    }

    const data = (await response.json()) as T;
    return data;
  }

  /**
   * Get real-time quotes for one or more symbols
   * @param symbols - Array of stock/crypto symbols (e.g., ['AAPL', 'MSFT', 'BTC-USD'])
   */
  async getQuotes(symbols: string[]): Promise<YahooQuote[]> {
    if (!symbols.length) {
      return [];
    }

    const symbolsParam = symbols.map((s) => s.toUpperCase()).join(',');

    const url = `${this.baseUrl}/chart/${symbolsParam}?interval=1d&range=1d`;

    interface QuoteResponse {
      chart?: {
        result?: Array<{
          meta: {
            symbol: string;
            regularMarketPrice: number;
            chartPreviousClose?: number;
            currency?: string;
            exchangeName?: string;
            instrumentType?: string;
            regularMarketTime?: number;
          };
        }>;
        error?: { code: string; description: string };
      };
    }

    const response = await this.fetchWithTimeout(url);
    const data = await this.handleResponse<QuoteResponse>(response);

    if (data.chart?.error) {
      throw new YahooFinanceError(
        data.chart.error.description,
        undefined,
        symbols[0]
      );
    }

    const results = data.chart?.result || [];

    return results.map((result): YahooQuote => ({
      symbol: result.meta.symbol,
      regularMarketPrice: result.meta.regularMarketPrice ?? null,
      regularMarketChange: null,
      regularMarketChangePercent: null,
      regularMarketOpen: null,
      regularMarketDayHigh: null,
      regularMarketDayLow: null,
      regularMarketVolume: null,
      marketCap: null,
      trailingPE: null,
      forwardPE: null,
      dividendYield: null,
      averageVolume: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      fiftyDayAverage: null,
      twoHundredDayAverage: null,
      currency: result.meta.currency,
      exchange: result.meta.exchangeName,
      quoteType: (result.meta.instrumentType?.toUpperCase() || 'EQUITY') as YahooQuote['quoteType'],
      regularMarketTime: result.meta.regularMarketTime,
    }));
  }

  /**
   * Get detailed quote for a single symbol
   * @param symbol - Stock/crypto symbol (e.g., 'AAPL', 'BTC-USD')
   */
  async getQuote(symbol: string): Promise<YahooQuote> {
    const quotes = await this.getQuotes([symbol]);

    if (!quotes.length) {
      throw new YahooFinanceNotFoundError(symbol);
    }

    return quotes[0];
  }

  /**
   * Get historical chart data for a symbol
   * @param symbol - Stock/crypto symbol
   * @param options - Chart options (interval, range, dates)
   */
  async getChart(
    symbol: string,
    options: ChartOptions = {}
  ): Promise<YahooChartResult> {
    const { interval = '1d', range = '1mo' } = options;

    let url: string;

    if (options.startDate && options.endDate) {
      const period1 = Math.floor(options.startDate.getTime() / 1000);
      const period2 = Math.floor(options.endDate.getTime() / 1000);
      url = `${this.chartUrl}/chart/${symbol}?interval=${interval}&period1=${period1}&period2=${period2}`;
    } else {
      url = `${this.chartUrl}/chart/${symbol}?interval=${interval}&range=${range}`;
    }

    const response = await this.fetchWithTimeout(url);

    interface ChartResponse {
      chart?: {
        result?: YahooChartResult[];
        error?: { code: string; description: string };
      };
    }

    const data = await this.handleResponse<ChartResponse>(response);

    if (data.chart?.error) {
      throw new YahooFinanceError(
        data.chart.error.description,
        undefined,
        symbol
      );
    }

    if (!data.chart?.result?.length) {
      throw new YahooFinanceNotFoundError(symbol);
    }

    return data.chart.result[0];
  }

  /**
   * Get processed historical data points
   * @param symbol - Stock/crypto symbol
   * @param options - Chart options
   */
  async getHistoricalData(
    symbol: string,
    options: ChartOptions = {}
  ): Promise<HistoricalDataPoint[]> {
    const chart = await this.getChart(symbol, options);

    const timestamps = chart.timestamp || [];
    const quote = chart.indicators.quote[0];
    const adjclose = chart.indicators.adjclose?.[0]?.adjclose;

    return timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000),
      open: quote.open?.[index] ?? null,
      high: quote.high?.[index] ?? null,
      low: quote.low?.[index] ?? null,
      close: quote.close?.[index] ?? null,
      volume: quote.volume?.[index] ?? null,
      adjustedClose: adjclose?.[index] ?? null,
    }));
  }

  /**
   * Search for stocks/crypto by keyword
   * @param query - Search query
   */
  async search(query: string): Promise<YahooSearchResult[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodedQuery}&quotesCount=10&newsCount=0`;

    const response = await this.fetchWithTimeout(url);

    interface SearchResponse {
      quotes?: YahooSearchResult[];
    }

    const data = await this.handleResponse<SearchResponse>(response);
    return data.quotes || [];
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
      // Use a well-known symbol to check health
      const url = `${this.baseUrl}/chart/AAPL?interval=1d&range=1d`;
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

let clientInstance: YahooFinanceClient | null = null;

export function getYahooFinanceClient(
  config?: YahooFinanceConfig
): YahooFinanceClient {
  if (!clientInstance || config) {
    clientInstance = new YahooFinanceClient(config);
  }
  return clientInstance;
}

// Export individual methods for convenience
export const yahooFinance = {
  getQuote: (symbol: string) => getYahooFinanceClient().getQuote(symbol),
  getQuotes: (symbols: string[]) => getYahooFinanceClient().getQuotes(symbols),
  getChart: (symbol: string, options?: ChartOptions) =>
    getYahooFinanceClient().getChart(symbol, options),
  getHistoricalData: (symbol: string, options?: ChartOptions) =>
    getYahooFinanceClient().getHistoricalData(symbol, options),
  search: (query: string) => getYahooFinanceClient().search(query),
  healthCheck: () => getYahooFinanceClient().healthCheck(),
};
