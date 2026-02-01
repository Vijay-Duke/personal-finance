import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { dataSources } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, noContent, unauthorized, notFound } from '../../../lib/api/response';

export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Data source ID is required');
  }

  try {
    const [source] = await db
      .select()
      .from(dataSources)
      .where(
        and(
          eq(dataSources.id, id),
          eq(dataSources.householdId, session.user.householdId)
        )
      );

    if (!source) {
      return notFound('Data source not found');
    }

    return json(source);
  } catch (err) {
    console.error('Error fetching data source:', err);
    return error('Failed to fetch data source', 500);
  }
};

export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Data source ID is required');
  }

  try {
    const body = await context.request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.apiKey !== undefined) updateData.apiKey = body.apiKey;
    if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled;
    if (body.syncFrequency) updateData.syncFrequency = body.syncFrequency;

    const [result] = await db
      .update(dataSources)
      .set(updateData)
      .where(
        and(
          eq(dataSources.id, id),
          eq(dataSources.householdId, session.user.householdId)
        )
      )
      .returning();

    if (!result) {
      return notFound('Data source not found');
    }

    return json(result);
  } catch (err) {
    console.error('Error updating data source:', err);
    return error('Failed to update data source', 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Data source ID is required');
  }

  try {
    await db
      .delete(dataSources)
      .where(
        and(
          eq(dataSources.id, id),
          eq(dataSources.householdId, session.user.householdId)
        )
      );

    return noContent();
  } catch (err) {
    console.error('Error deleting data source:', err);
    return error('Failed to delete data source', 500);
  }
};

/**
 * POST - Trigger sync for this data source
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Data source ID is required');
  }

  try {
    const [existing] = await db
      .select()
      .from(dataSources)
      .where(
        and(
          eq(dataSources.id, id),
          eq(dataSources.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('Data source not found');
    }

    // Update lastSyncAt
    const [result] = await db
      .update(dataSources)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(dataSources.id, id))
      .returning();

    return json({
      success: true,
      dataSource: result,
      message: 'Sync triggered',
    });
  } catch (err) {
    console.error('Error triggering sync:', err);
    return error('Failed to trigger sync', 500);
  }
};
