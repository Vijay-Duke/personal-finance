import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { categories } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized, notFound } from '../../../lib/api/response';

/**
 * GET /api/categories/[id]
 * Get a single category.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Category ID is required');
  }

  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, id),
          eq(categories.householdId, session.user.householdId)
        )
      );

    if (!category) {
      return notFound('Category not found');
    }

    return json(category);
  } catch (err) {
    console.error('Error fetching category:', err);
    return error('Failed to fetch category', 500);
  }
};

/**
 * PUT /api/categories/[id]
 * Update a category.
 */
export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Category ID is required');
  }

  try {
    // Verify category exists and belongs to household
    const [existing] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, id),
          eq(categories.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('Category not found');
    }

    const body = await context.request.json();

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name?.trim()) {
      updates.name = body.name.trim();
    }
    if (body.type && ['income', 'expense', 'transfer'].includes(body.type)) {
      updates.type = body.type;
    }
    if (body.icon !== undefined) {
      updates.icon = body.icon;
    }
    if (body.color !== undefined) {
      updates.color = body.color;
    }
    if (body.sortOrder !== undefined) {
      updates.sortOrder = body.sortOrder;
    }

    const [updated] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();

    return json(updated);
  } catch (err) {
    console.error('Error updating category:', err);
    return error('Failed to update category', 500);
  }
};

/**
 * DELETE /api/categories/[id]
 * Delete a category.
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Category ID is required');
  }

  try {
    // Verify category exists and belongs to household
    const [existing] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, id),
          eq(categories.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('Category not found');
    }

    // Prevent deletion of system categories
    if (existing.isSystem) {
      return error('System categories cannot be deleted', 403);
    }

    await db.delete(categories).where(eq(categories.id, id));

    return json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    return error('Failed to delete category', 500);
  }
};
