import type { APIRoute } from 'astro';
import { json, error } from '@/lib/api/response';

/**
 * GET /api/stocks/profile?symbol=AAPL
 * Get company profile including logo
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
    return getMockProfile(symbol);
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Finnhub API error');
    }

    const data = await response.json();

    if (!data.name) {
      return getMockProfile(symbol);
    }

    return json({
      name: data.name,
      exchange: data.exchange,
      finnhubIndustry: data.finnhubIndustry || 'Unknown',
      country: data.country,
      logo: data.logo,
      weburl: data.weburl,
    });
  } catch (err) {
    console.error('Stock profile error:', err);
    return getMockProfile(symbol);
  }
};

// Mock profiles for common stocks
function getMockProfile(symbol: string) {
  const mockProfiles: Record<string, any> = {
    AAPL: { name: 'Apple Inc', exchange: 'NASDAQ', finnhubIndustry: 'Technology', country: 'US', logo: 'https://logo.clearbit.com/apple.com' },
    MSFT: { name: 'Microsoft Corporation', exchange: 'NASDAQ', finnhubIndustry: 'Technology', country: 'US', logo: 'https://logo.clearbit.com/microsoft.com' },
    GOOGL: { name: 'Alphabet Inc', exchange: 'NASDAQ', finnhubIndustry: 'Communication Services', country: 'US', logo: 'https://logo.clearbit.com/abc.xyz' },
    AMZN: { name: 'Amazon.com Inc', exchange: 'NASDAQ', finnhubIndustry: 'Consumer Cyclical', country: 'US', logo: 'https://logo.clearbit.com/amazon.com' },
    TSLA: { name: 'Tesla Inc', exchange: 'NASDAQ', finnhubIndustry: 'Automotive', country: 'US', logo: 'https://logo.clearbit.com/tesla.com' },
    NVDA: { name: 'NVIDIA Corporation', exchange: 'NASDAQ', finnhubIndustry: 'Technology', country: 'US', logo: 'https://logo.clearbit.com/nvidia.com' },
    META: { name: 'Meta Platforms Inc', exchange: 'NASDAQ', finnhubIndustry: 'Communication Services', country: 'US', logo: 'https://logo.clearbit.com/meta.com' },
    'BRK.B': { name: 'Berkshire Hathaway Inc', exchange: 'NYSE', finnhubIndustry: 'Financial Services', country: 'US' },
    JPM: { name: 'JPMorgan Chase & Co', exchange: 'NYSE', finnhubIndustry: 'Financial Services', country: 'US', logo: 'https://logo.clearbit.com/jpmorganchase.com' },
    V: { name: 'Visa Inc', exchange: 'NYSE', finnhubIndustry: 'Financial Services', country: 'US', logo: 'https://logo.clearbit.com/visa.com' },
    JNJ: { name: 'Johnson & Johnson', exchange: 'NYSE', finnhubIndustry: 'Healthcare', country: 'US', logo: 'https://logo.clearbit.com/jnj.com' },
    WMT: { name: 'Walmart Inc', exchange: 'NYSE', finnhubIndustry: 'Consumer Defensive', country: 'US', logo: 'https://logo.clearbit.com/walmart.com' },
    MA: { name: 'Mastercard Inc', exchange: 'NYSE', finnhubIndustry: 'Financial Services', country: 'US', logo: 'https://logo.clearbit.com/mastercard.com' },
    PG: { name: 'Procter & Gamble Co', exchange: 'NYSE', finnhubIndustry: 'Consumer Defensive', country: 'US', logo: 'https://logo.clearbit.com/pg.com' },
    UNH: { name: 'UnitedHealth Group Inc', exchange: 'NYSE', finnhubIndustry: 'Healthcare', country: 'US', logo: 'https://logo.clearbit.com/unitedhealthgroup.com' },
    HD: { name: 'Home Depot Inc', exchange: 'NYSE', finnhubIndustry: 'Consumer Cyclical', country: 'US', logo: 'https://logo.clearbit.com/homedepot.com' },
    CVX: { name: 'Chevron Corporation', exchange: 'NYSE', finnhubIndustry: 'Energy', country: 'US', logo: 'https://logo.clearbit.com/chevron.com' },
    MRK: { name: 'Merck & Co Inc', exchange: 'NYSE', finnhubIndustry: 'Healthcare', country: 'US', logo: 'https://logo.clearbit.com/merck.com' },
    KO: { name: 'Coca-Cola Co', exchange: 'NYSE', finnhubIndustry: 'Consumer Defensive', country: 'US', logo: 'https://logo.clearbit.com/coca-cola.com' },
    PEP: { name: 'PepsiCo Inc', exchange: 'NASDAQ', finnhubIndustry: 'Consumer Defensive', country: 'US', logo: 'https://logo.clearbit.com/pepsico.com' },
    BABA: { name: 'Alibaba Group Holding Ltd', exchange: 'NYSE', finnhubIndustry: 'Consumer Cyclical', country: 'CN', logo: 'https://logo.clearbit.com/alibabagroup.com' },
    TCEHY: { name: 'Tencent Holdings Ltd', exchange: 'OTC', finnhubIndustry: 'Communication Services', country: 'CN' },
    TM: { name: 'Toyota Motor Corp', exchange: 'NYSE', finnhubIndustry: 'Automotive', country: 'JP', logo: 'https://logo.clearbit.com/toyota.com' },
    SHEL: { name: 'Shell plc', exchange: 'NYSE', finnhubIndustry: 'Energy', country: 'GB', logo: 'https://logo.clearbit.com/shell.com' },
    NVS: { name: 'Novartis AG', exchange: 'NYSE', finnhubIndustry: 'Healthcare', country: 'CH', logo: 'https://logo.clearbit.com/novartis.com' },
    TSM: { name: 'Taiwan Semiconductor Manufacturing', exchange: 'NYSE', finnhubIndustry: 'Technology', country: 'TW', logo: 'https://logo.clearbit.com/tsmc.com' },
    NVO: { name: 'Novo Nordisk A/S', exchange: 'NYSE', finnhubIndustry: 'Healthcare', country: 'DK', logo: 'https://logo.clearbit.com/novonordisk.com' },
    ASML: { name: 'ASML Holding NV', exchange: 'NASDAQ', finnhubIndustry: 'Technology', country: 'NL', logo: 'https://logo.clearbit.com/asml.com' },
    SAP: { name: 'SAP SE', exchange: 'NYSE', finnhubIndustry: 'Technology', country: 'DE', logo: 'https://logo.clearbit.com/sap.com' },
    TD: { name: 'Toronto-Dominion Bank', exchange: 'NYSE', finnhubIndustry: 'Financial Services', country: 'CA', logo: 'https://logo.clearbit.com/td.com' },
    ENB: { name: 'Enbridge Inc', exchange: 'NYSE', finnhubIndustry: 'Energy', country: 'CA', logo: 'https://logo.clearbit.com/enbridge.com' },
    BP: { name: 'BP plc', exchange: 'NYSE', finnhubIndustry: 'Energy', country: 'GB', logo: 'https://logo.clearbit.com/bp.com' },
    UL: { name: 'Unilever PLC', exchange: 'NYSE', finnhubIndustry: 'Consumer Defensive', country: 'GB', logo: 'https://logo.clearbit.com/unilever.com' },
    // UK / Europe
    AZN: { name: 'AstraZeneca PLC', exchange: 'NASDAQ', finnhubIndustry: 'Healthcare', country: 'GB', logo: 'https://logo.clearbit.com/astrazeneca.com' },
    GSK: { name: 'GSK PLC', exchange: 'NYSE', finnhubIndustry: 'Healthcare', country: 'GB', logo: 'https://logo.clearbit.com/gsk.com' },
    RY: { name: 'Royal Bank of Canada', exchange: 'NYSE', finnhubIndustry: 'Financial Services', country: 'CA', logo: 'https://logo.clearbit.com/rbc.com' },
    SHOP: { name: 'Shopify Inc', exchange: 'NYSE', finnhubIndustry: 'Technology', country: 'CA', logo: 'https://logo.clearbit.com/shopify.com' },
    NESN: { name: 'Nestle SA', exchange: 'SWX', finnhubIndustry: 'Consumer Defensive', country: 'CH', logo: 'https://logo.clearbit.com/nestle.com' },
    ROG: { name: 'Roche Holding AG', exchange: 'SWX', finnhubIndustry: 'Healthcare', country: 'CH', logo: 'https://logo.clearbit.com/roche.com' },
    AIR: { name: 'Airbus SE', exchange: 'EPA', finnhubIndustry: 'Industrials', country: 'FR', logo: 'https://logo.clearbit.com/airbus.com' },
    MC: { name: 'LVMH Moet Hennessy', exchange: 'EPA', finnhubIndustry: 'Consumer Cyclical', country: 'FR', logo: 'https://logo.clearbit.com/lvmh.com' },
    OR: { name: "L'Oreal SA", exchange: 'EPA', finnhubIndustry: 'Consumer Defensive', country: 'FR', logo: 'https://logo.clearbit.com/loreal.com' },
    SAN: { name: 'Sanofi SA', exchange: 'EPA', finnhubIndustry: 'Healthcare', country: 'FR', logo: 'https://logo.clearbit.com/sanofi.com' },
    SIE: { name: 'Siemens AG', exchange: 'ETR', finnhubIndustry: 'Industrials', country: 'DE', logo: 'https://logo.clearbit.com/siemens.com' },
    ALV: { name: 'Allianz SE', exchange: 'ETR', finnhubIndustry: 'Financial Services', country: 'DE', logo: 'https://logo.clearbit.com/allianz.com' },
    BMW: { name: 'Bayerische Motoren Werke AG', exchange: 'ETR', finnhubIndustry: 'Automotive', country: 'DE', logo: 'https://logo.clearbit.com/bmw.com' },
    DTE: { name: 'Deutsche Telekom AG', exchange: 'ETR', finnhubIndustry: 'Communication Services', country: 'DE', logo: 'https://logo.clearbit.com/telekom.com' },
    // Japan
    SONY: { name: 'Sony Group Corp', exchange: 'TSE', finnhubIndustry: 'Consumer Cyclical', country: 'JP', logo: 'https://logo.clearbit.com/sony.com' },
    // Australia
    CBA: { name: 'Commonwealth Bank', exchange: 'ASX', finnhubIndustry: 'Financial Services', country: 'AU', logo: 'https://logo.clearbit.com/commbank.com.au' },
    BHP: { name: 'BHP Group Ltd', exchange: 'ASX', finnhubIndustry: 'Materials', country: 'AU', logo: 'https://logo.clearbit.com/bhp.com' },
    CSL: { name: 'CSL Ltd', exchange: 'ASX', finnhubIndustry: 'Healthcare', country: 'AU', logo: 'https://logo.clearbit.com/csl.com.au' },
    NAB: { name: 'National Australia Bank', exchange: 'ASX', finnhubIndustry: 'Financial Services', country: 'AU', logo: 'https://logo.clearbit.com/nab.com.au' },
    WBC: { name: 'Westpac Banking Corp', exchange: 'ASX', finnhubIndustry: 'Financial Services', country: 'AU', logo: 'https://logo.clearbit.com/westpac.com.au' },
  };

  const upperSymbol = symbol.toUpperCase();
  const profile = mockProfiles[upperSymbol] || {
    name: `${symbol} Corp`,
    exchange: 'NYSE',
    finnhubIndustry: 'Unknown',
    country: 'US',
  };

  // Try to get logo from Clearbit
  if (!profile.logo) {
    profile.logo = `https://logo.clearbit.com/${symbol.toLowerCase()}.com`;
  }

  return json(profile);
}
