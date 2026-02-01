import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { dataSources, type NewDataSource } from '../../../lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/data-sources
 * List all data sources for the current household.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const sources = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.householdId, session.user.householdId))
      .orderBy(asc(dataSources.type), asc(dataSources.provider));

    return json(sources);
  } catch (err) {
    console.error('Error fetching data sources:', err);
    return error('Failed to fetch data sources', 500);
  }
};

/**
 * POST /api/data-sources
 * Create a new data source.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    if (!body.type || !body.provider) {
      return error('Type and provider are required');
    }

    const newDataSource: NewDataSource = {
      householdId: session.user.householdId,
      type: body.type,
      provider: body.provider,
      apiKey: body.apiKey || undefined,
      isEnabled: body.isEnabled ?? true,
      syncFrequency: body.syncFrequency || 'daily',
    };

    const [result] = await db.insert(dataSources).values(newDataSource).returning();

    return created(result);
  } catch (err) {
    console.error('Error creating data source:', err);
    return error('Failed to create data source', 500);
  }
};
