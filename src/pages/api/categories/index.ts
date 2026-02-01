import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { categories, type NewCategory } from '../../../lib/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/categories
 * List all categories for the household.
 *
 * Query params:
 * - type: Filter by type (income/expense/transfer)
 * - flat: If true, returns flat list; otherwise returns hierarchical structure
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const typeFilter = url.searchParams.get('type');
  const flat = url.searchParams.get('flat') === 'true';

  try {
    const conditions = [eq(categories.householdId, session.user.householdId)];

    if (typeFilter && ['income', 'expense', 'transfer'].includes(typeFilter)) {
      conditions.push(eq(categories.type, typeFilter as 'income' | 'expense' | 'transfer'));
    }

    const results = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    if (flat) {
      return json(results);
    }

    // Build hierarchical structure
    const rootCategories = results.filter(c => !c.parentId);
    const childCategories = results.filter(c => c.parentId);

    const hierarchical = rootCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(c => c.parentId === parent.id),
    }));

    return json(hierarchical);
  } catch (err) {
    console.error('Error fetching categories:', err);
    return error('Failed to fetch categories', 500);
  }
};

/**
 * POST /api/categories
 * Create a new category.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return error('Category name is required');
    }
    if (!body.type || !['income', 'expense', 'transfer'].includes(body.type)) {
      return error('Valid category type is required');
    }

    // If parent is specified, verify it belongs to household
    if (body.parentId) {
      const [parent] = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.id, body.parentId),
            eq(categories.householdId, session.user.householdId)
          )
        );

      if (!parent) {
        return error('Parent category not found', 404);
      }
    }

    const categoryData: NewCategory = {
      householdId: session.user.householdId,
      name: body.name.trim(),
      type: body.type,
      icon: body.icon,
      color: body.color,
      parentId: body.parentId,
      isSystem: false,
      sortOrder: body.sortOrder || 0,
    };

    const [newCategory] = await db.insert(categories).values(categoryData).returning();

    return created(newCategory);
  } catch (err) {
    console.error('Error creating category:', err);
    return error('Failed to create category', 500);
  }
};
