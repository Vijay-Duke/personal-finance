import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { categoryRules, categories, accounts } from '../../../lib/db/schema';
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
    return error('Rule ID is required');
  }

  try {
    const [rule] = await db
      .select({
        id: categoryRules.id,
        name: categoryRules.name,
        matchType: categoryRules.matchType,
        matchField: categoryRules.matchField,
        matchValue: categoryRules.matchValue,
        caseSensitive: categoryRules.caseSensitive,
        accountId: categoryRules.accountId,
        transactionType: categoryRules.transactionType,
        categoryId: categoryRules.categoryId,
        priority: categoryRules.priority,
        isActive: categoryRules.isActive,
        matchCount: categoryRules.matchCount,
        lastMatchedAt: categoryRules.lastMatchedAt,
        createdAt: categoryRules.createdAt,
        categoryName: categories.name,
        categoryColor: categories.color,
        accountName: accounts.name,
      })
      .from(categoryRules)
      .leftJoin(categories, eq(categoryRules.categoryId, categories.id))
      .leftJoin(accounts, eq(categoryRules.accountId, accounts.id))
      .where(
        and(
          eq(categoryRules.id, id),
          eq(categoryRules.householdId, session.user.householdId)
        )
      );

    if (!rule) {
      return notFound('Category rule not found');
    }

    return json(rule);
  } catch (err) {
    console.error('Error fetching category rule:', err);
    return error('Failed to fetch category rule', 500);
  }
};

export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Rule ID is required');
  }

  try {
    const body = await context.request.json();

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.matchType !== undefined) updateData.matchType = body.matchType;
    if (body.matchField !== undefined) updateData.matchField = body.matchField;
    if (body.matchValue !== undefined) updateData.matchValue = body.matchValue.trim();
    if (body.caseSensitive !== undefined) updateData.caseSensitive = body.caseSensitive;
    if (body.accountId !== undefined) updateData.accountId = body.accountId || null;
    if (body.transactionType !== undefined) updateData.transactionType = body.transactionType || null;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Validate category if being updated
    if (body.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, body.categoryId));

      if (!category || category.householdId !== session.user.householdId) {
        return error('Category not found', 404);
      }
    }

    const [result] = await db
      .update(categoryRules)
      .set(updateData)
      .where(
        and(
          eq(categoryRules.id, id),
          eq(categoryRules.householdId, session.user.householdId)
        )
      )
      .returning();

    if (!result) {
      return notFound('Category rule not found');
    }

    return json(result);
  } catch (err) {
    console.error('Error updating category rule:', err);
    return error('Failed to update category rule', 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Rule ID is required');
  }

  try {
    await db
      .delete(categoryRules)
      .where(
        and(
          eq(categoryRules.id, id),
          eq(categoryRules.householdId, session.user.householdId)
        )
      );

    return noContent();
  } catch (err) {
    console.error('Error deleting category rule:', err);
    return error('Failed to delete category rule', 500);
  }
};
