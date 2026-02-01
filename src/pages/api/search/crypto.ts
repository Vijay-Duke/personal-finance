import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized } from '../../../lib/api/response';
import { coinGecko } from '../../../lib/integrations';

/**
 * GET /api/search/crypto
 * Search for cryptocurrencies by query string.
 *
 * Query params:
 * - q: Search query (required, e.g., 'Bitcoin' or 'BTC')
 * - limit: Maximum number of results (default: 10)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const query = url.searchParams.get('q');
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  if (!query || query.trim().length === 0) {
    return error('Query parameter "q" is required');
  }

  if (query.trim().length < 2) {
    return error('Query must be at least 2 characters');
  }

  try {
    const results = await coinGecko.search(query.trim());

    // Limit results
    const limitedResults = results.slice(0, Math.min(limit, 20));

    // Format results
    const formatted = limitedResults.map((result) => ({
      id: result.id,
      symbol: result.symbol.toUpperCase(),
      name: result.name,
      platforms: result.platforms,
    }));

    return json({
      query: query.trim(),
      count: formatted.length,
      results: formatted,
    });
  } catch (err) {
    console.error('Error searching crypto:', err);
    if (err instanceof Error && err.message.includes('Rate limit')) {
      return error('Rate limit exceeded. Please try again later.', 429);
    }
    return error('Failed to search cryptocurrencies', 500);
  }
};
