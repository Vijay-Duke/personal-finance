import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { categoryRules, categories, accounts, type NewCategoryRule } from '../../../lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/category-rules
 * List all category rules for the current household.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const rules = await db
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
        // Join category name and color
        categoryName: categories.name,
        categoryColor: categories.color,
        // Join account name if restricted
        accountName: accounts.name,
      })
      .from(categoryRules)
      .leftJoin(categories, eq(categoryRules.categoryId, categories.id))
      .leftJoin(accounts, eq(categoryRules.accountId, accounts.id))
      .where(eq(categoryRules.householdId, session.user.householdId))
      .orderBy(asc(categoryRules.priority), asc(categoryRules.name));

    return json(rules);
  } catch (err) {
    console.error('Error fetching category rules:', err);
    return error('Failed to fetch category rules', 500);
  }
};

/**
 * POST /api/category-rules
 * Create a new category rule.
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
      return error('Rule name is required');
    }
    if (!body.matchValue?.trim()) {
      return error('Match value is required');
    }
    if (!body.categoryId) {
      return error('Category is required');
    }

    // Validate category belongs to household
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, body.categoryId));

    if (!category || category.householdId !== session.user.householdId) {
      return error('Category not found', 404);
    }

    // If account specified, validate it
    if (body.accountId) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, body.accountId));

      if (!account || account.householdId !== session.user.householdId) {
        return error('Account not found', 404);
      }
    }

    const newRule: NewCategoryRule = {
      householdId: session.user.householdId,
      name: body.name.trim(),
      matchType: body.matchType || 'contains',
      matchField: body.matchField || 'description',
      matchValue: body.matchValue.trim(),
      caseSensitive: body.caseSensitive ?? false,
      accountId: body.accountId || undefined,
      transactionType: body.transactionType || undefined,
      categoryId: body.categoryId,
      priority: body.priority ?? 100,
      isActive: body.isActive ?? true,
    };

    const [result] = await db.insert(categoryRules).values(newRule).returning();

    return created(result);
  } catch (err) {
    console.error('Error creating category rule:', err);
    return error('Failed to create category rule', 500);
  }
};
