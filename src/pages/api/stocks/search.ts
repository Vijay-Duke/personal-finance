import type { APIRoute } from 'astro';
import { json, error } from '@/lib/api/response';

/**
 * GET /api/stocks/search?q=AAPL
 * Search for stock symbols using Finnhub API
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query || query.length < 1) {
    return json([]);
  }

  const apiKey = import.meta.env.FINNHUB_API_KEY;

  // If no API key, return mock data for demo
  if (!apiKey) {
    return getMockResults(query);
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Finnhub API error');
    }

    const data = await response.json();

    // Filter and format results
    const results = (data.result || [])
      .filter((item: any) =>
        item.type === 'Common Stock' ||
        item.type === 'ADR' ||
        item.type === 'ETP' ||
        item.symbol.includes(query.toUpperCase())
      )
      .slice(0, 10)
      .map((item: any) => ({
        symbol: item.symbol,
        description: item.description,
        type: item.type,
        exchange: item.exchange,
      }));

    return json(results);
  } catch (err) {
    console.error('Stock search error:', err);
    return getMockResults(query);
  }
};

// Mock data for demo when API key is not available
function getMockResults(query: string) {
  const mockStocks = [
    { symbol: 'AAPL', description: 'Apple Inc', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'MSFT', description: 'Microsoft Corporation', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', description: 'Alphabet Inc', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'AMZN', description: 'Amazon.com Inc', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'TSLA', description: 'Tesla Inc', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'NVDA', description: 'NVIDIA Corporation', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'META', description: 'Meta Platforms Inc', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'BRK.B', description: 'Berkshire Hathaway Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'JPM', description: 'JPMorgan Chase & Co', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'V', description: 'Visa Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'JNJ', description: 'Johnson & Johnson', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'WMT', description: 'Walmart Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'MA', description: 'Mastercard Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'PG', description: 'Procter & Gamble Co', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'UNH', description: 'UnitedHealth Group Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'HD', description: 'Home Depot Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'CVX', description: 'Chevron Corporation', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'MRK', description: 'Merck & Co Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'KO', description: 'Coca-Cola Co', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'PEP', description: 'PepsiCo Inc', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'BABA', description: 'Alibaba Group Holding Ltd', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'TCEHY', description: 'Tencent Holdings Ltd', type: 'ADR', exchange: 'OTC' },
    { symbol: 'TM', description: 'Toyota Motor Corp', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'SHEL', description: 'Shell plc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'NVS', description: 'Novartis AG', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'TSM', description: 'Taiwan Semiconductor', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'NVO', description: 'Novo Nordisk A/S', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'ASML', description: 'ASML Holding NV', type: 'ADR', exchange: 'NASDAQ' },
    { symbol: 'SAP', description: 'SAP SE', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'SONY', description: 'Sony Group Corporation', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'TTWO', description: 'Take-Two Interactive Software Inc', type: 'Common Stock', exchange: 'NASDAQ' },
    { symbol: 'TD', description: 'Toronto-Dominion Bank', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'ENB', description: 'Enbridge Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'BP', description: 'BP plc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'UL', description: 'Unilever PLC', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'SPY', description: 'SPDR S&P 500 ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    { symbol: 'VOO', description: 'Vanguard S&P 500 ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    { symbol: 'VTI', description: 'Vanguard Total Stock Market ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    { symbol: 'QQQ', description: 'Invesco QQQ Trust', type: 'ETP', exchange: 'NASDAQ' },
    { symbol: 'IWM', description: 'iShares Russell 2000 ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    { symbol: 'VEA', description: 'Vanguard FTSE Developed Markets ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    { symbol: 'VWO', description: 'Vanguard FTSE Emerging Markets ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    { symbol: 'BND', description: 'Vanguard Total Bond Market ETF', type: 'ETP', exchange: 'NASDAQ' },
    { symbol: 'AGG', description: 'iShares Core US Aggregate Bond ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    { symbol: 'VUG', description: 'Vanguard Growth ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    { symbol: 'VTV', description: 'Vanguard Value ETF', type: 'ETP', exchange: 'NYSE ARCA' },
    // UK / Europe
    { symbol: 'AZN', description: 'AstraZeneca PLC', type: 'ADR', exchange: 'NASDAQ' },
    { symbol: 'GSK', description: 'GSK PLC', type: 'ADR', exchange: 'NYSE' },
    { symbol: 'RY', description: 'Royal Bank of Canada', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'SHOP', description: 'Shopify Inc', type: 'Common Stock', exchange: 'NYSE' },
    { symbol: 'CSU', description: 'Constellation Software Inc', type: 'Common Stock', exchange: 'TSX' },
    { symbol: 'LONN', description: 'Lonza Group AG', type: 'Common Stock', exchange: 'SWX' },
    { symbol: 'NESN', description: 'Nestle SA', type: 'Common Stock', exchange: 'SWX' },
    { symbol: 'ROG', description: 'Roche Holding AG', type: 'Common Stock', exchange: 'SWX' },
    { symbol: 'ASML', description: 'ASML Holding NV', type: 'Common Stock', exchange: 'AMS' },
    { symbol: 'AIR', description: 'Airbus SE', type: 'Common Stock', exchange: 'EPA' },
    { symbol: 'MC', description: 'LVMH Moet Hennessy', type: 'Common Stock', exchange: 'EPA' },
    { symbol: 'OR', description: 'L Oreal SA', type: 'Common Stock', exchange: 'EPA' },
    { symbol: 'SAN', description: 'Sanofi SA', type: 'Common Stock', exchange: 'EPA' },
    { symbol: 'SIE', description: 'Siemens AG', type: 'Common Stock', exchange: 'ETR' },
    { symbol: 'ALV', description: 'Allianz SE', type: 'Common Stock', exchange: 'ETR' },
    { symbol: 'BMW', description: 'Bayerische Motoren Werke AG', type: 'Common Stock', exchange: 'ETR' },
    { symbol: 'DTE', description: 'Deutsche Telekom AG', type: 'Common Stock', exchange: 'ETR' },
    // Japan
    { symbol: '7203', description: 'Toyota Motor Corp', type: 'Common Stock', exchange: 'TSE' },
    { symbol: '6758', description: 'Sony Group Corp', type: 'Common Stock', exchange: 'TSE' },
    { symbol: '6861', description: 'Keyence Corp', type: 'Common Stock', exchange: 'TSE' },
    { symbol: '9984', description: 'SoftBank Group Corp', type: 'Common Stock', exchange: 'TSE' },
    { symbol: '8306', description: 'Mitsubishi UFJ Financial', type: 'Common Stock', exchange: 'TSE' },
    // Hong Kong / China
    { symbol: '2318', description: 'Ping An Insurance', type: 'Common Stock', exchange: 'HKEX' },
    { symbol: '700', description: 'Tencent Holdings Ltd', type: 'Common Stock', exchange: 'HKEX' },
    { symbol: '3690', description: 'Meituan', type: 'Common Stock', exchange: 'HKEX' },
    { symbol: '1810', description: 'Xiaomi Corp', type: 'Common Stock', exchange: 'HKEX' },
    { symbol: '9988', description: 'Alibaba Group', type: 'Common Stock', exchange: 'HKEX' },
    // Australia
    { symbol: 'CBA', description: 'Commonwealth Bank', type: 'Common Stock', exchange: 'ASX' },
    { symbol: 'BHP', description: 'BHP Group Ltd', type: 'Common Stock', exchange: 'ASX' },
    { symbol: 'CSL', description: 'CSL Ltd', type: 'Common Stock', exchange: 'ASX' },
    { symbol: 'NAB', description: 'National Australia Bank', type: 'Common Stock', exchange: 'ASX' },
    { symbol: 'WBC', description: 'Westpac Banking Corp', type: 'Common Stock', exchange: 'ASX' },
    { symbol: 'ANZ', description: 'ANZ Group Holdings', type: 'Common Stock', exchange: 'ASX' },
    { symbol: 'WES', description: 'Wesfarmers Ltd', type: 'Common Stock', exchange: 'ASX' },
    { symbol: 'MQG', description: 'Macquarie Group Ltd', type: 'Common Stock', exchange: 'ASX' },
    // India
    { symbol: 'RELIANCE', description: 'Reliance Industries', type: 'Common Stock', exchange: 'NSE' },
    { symbol: 'TCS', description: 'Tata Consultancy Services', type: 'Common Stock', exchange: 'NSE' },
    { symbol: 'HDFCBANK', description: 'HDFC Bank Ltd', type: 'Common Stock', exchange: 'NSE' },
    { symbol: 'INFY', description: 'Infosys Ltd', type: 'Common Stock', exchange: 'NSE' },
    { symbol: 'HINDUNILVR', description: 'Hindustan Unilever', type: 'Common Stock', exchange: 'NSE' },
    // Brazil
    { symbol: 'PETR4', description: 'Petrobras', type: 'Common Stock', exchange: 'B3' },
    { symbol: 'VALE3', description: 'Vale SA', type: 'Common Stock', exchange: 'B3' },
    // South Korea
    { symbol: '005930', description: 'Samsung Electronics', type: 'Common Stock', exchange: 'KRX' },
    { symbol: '000660', description: 'SK Hynix Inc', type: 'Common Stock', exchange: 'KRX' },
    // Taiwan
    { symbol: '2330', description: 'Taiwan Semiconductor', type: 'Common Stock', exchange: 'TWSE' },
    { symbol: '2317', description: 'Foxconn Technology', type: 'Common Stock', exchange: 'TWSE' },
    // Singapore
    { symbol: 'D05', description: 'DBS Group Holdings', type: 'Common Stock', exchange: 'SGX' },
    { symbol: 'O39', description: 'Oversea-Chinese Banking', type: 'Common Stock', exchange: 'SGX' },
  ];

  const results = mockStocks.filter(
    stock =>
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  return json(results);
}
