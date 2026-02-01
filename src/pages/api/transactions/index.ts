import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  transactions,
  transactionSplits,
  transactionTags,
  accounts,
  categories,
  tags,
  type NewTransaction,
  type NewTransactionSplit,
} from '../../../lib/db/schema';
import { eq, and, desc, gte, lte, or, like, inArray, sql } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/transactions
 * List transactions with filters and pagination.
 *
 * Query params:
 * - accountId: Filter by account
 * - categoryId: Filter by category
 * - type: Filter by type (income/expense/transfer)
 * - status: Filter by status
 * - startDate: Filter from date (ISO string)
 * - endDate: Filter to date (ISO string)
 * - search: Search in description/merchant
 * - tagIds: Comma-separated tag IDs
 * - limit: Number of results (default 50, max 200)
 * - offset: Pagination offset
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const accountId = url.searchParams.get('accountId');
  const categoryId = url.searchParams.get('categoryId');
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const search = url.searchParams.get('search');
  const tagIdsParam = url.searchParams.get('tagIds');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    // Build conditions
    const conditions = [eq(transactions.householdId, session.user.householdId)];

    if (accountId) {
      conditions.push(eq(transactions.accountId, accountId));
    }
    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }
    if (type && ['income', 'expense', 'transfer'].includes(type)) {
      conditions.push(eq(transactions.type, type as 'income' | 'expense' | 'transfer'));
    }
    if (status && ['pending', 'cleared', 'reconciled', 'void'].includes(status)) {
      conditions.push(eq(transactions.status, status as any));
    }
    if (startDate) {
      conditions.push(gte(transactions.date, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, new Date(endDate)));
    }
    if (search) {
      conditions.push(
        or(
          like(transactions.description, `%${search}%`),
          like(transactions.merchant, `%${search}%`)
        )!
      );
    }

    // Get transactions
    const results = await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        transferAccountId: transactions.transferAccountId,
        linkedTransactionId: transactions.linkedTransactionId,
        type: transactions.type,
        status: transactions.status,
        amount: transactions.amount,
        currency: transactions.currency,
        date: transactions.date,
        description: transactions.description,
        merchant: transactions.merchant,
        categoryId: transactions.categoryId,
        notes: transactions.notes,
        reference: transactions.reference,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        // Join account name
        accountName: accounts.name,
        // Join category name
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Filter by tags if specified
    let filteredResults = results;
    if (tagIdsParam) {
      const tagIds = tagIdsParam.split(',').filter(Boolean);
      if (tagIds.length > 0) {
        const transactionIdsWithTags = await db
          .select({ transactionId: transactionTags.transactionId })
          .from(transactionTags)
          .where(inArray(transactionTags.tagId, tagIds));
        const txIdsWithTags = new Set(transactionIdsWithTags.map(t => t.transactionId));
        filteredResults = results.filter(tx => txIdsWithTags.has(tx.id));
      }
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions));

    // Get tags for each transaction
    const transactionIds = filteredResults.map(tx => tx.id);
    const allTags = transactionIds.length > 0
      ? await db
          .select({
            transactionId: transactionTags.transactionId,
            tagId: tags.id,
            tagName: tags.name,
            tagColor: tags.color,
          })
          .from(transactionTags)
          .innerJoin(tags, eq(transactionTags.tagId, tags.id))
          .where(inArray(transactionTags.transactionId, transactionIds))
      : [];

    // Group tags by transaction
    const tagsByTransaction = allTags.reduce((acc, tag) => {
      if (!acc[tag.transactionId]) acc[tag.transactionId] = [];
      acc[tag.transactionId].push({
        id: tag.tagId,
        name: tag.tagName,
        color: tag.tagColor,
      });
      return acc;
    }, {} as Record<string, { id: string; name: string; color: string | null }[]>);

    // Enrich with tags
    const enriched = filteredResults.map(tx => ({
      ...tx,
      tags: tagsByTransaction[tx.id] || [],
    }));

    return json({
      transactions: enriched,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
      },
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return error('Failed to fetch transactions', 500);
  }
};

/**
 * POST /api/transactions
 * Create a new transaction.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    // Validate required fields
    if (!body.accountId) {
      return error('Account is required');
    }
    if (!body.type || !['income', 'expense', 'transfer'].includes(body.type)) {
      return error('Valid transaction type is required');
    }
    if (body.amount === undefined || body.amount === null) {
      return error('Amount is required');
    }
    if (!body.date) {
      return error('Date is required');
    }

    // Verify account belongs to household
    const [account] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, body.accountId),
          eq(accounts.householdId, session.user.householdId)
        )
      );

    if (!account) {
      return error('Account not found', 404);
    }

    // For transfers, verify destination account
    if (body.type === 'transfer' && body.transferAccountId) {
      const [transferAccount] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, body.transferAccountId),
            eq(accounts.householdId, session.user.householdId)
          )
        );

      if (!transferAccount) {
        return error('Transfer destination account not found', 404);
      }
    }

    // Create transaction
    const transactionData: NewTransaction = {
      householdId: session.user.householdId,
      accountId: body.accountId,
      transferAccountId: body.type === 'transfer' ? body.transferAccountId : undefined,
      type: body.type,
      status: body.status || 'cleared',
      amount: Math.abs(body.amount),
      currency: body.currency || account.currency || 'USD',
      date: new Date(body.date),
      description: body.description?.trim(),
      merchant: body.merchant?.trim(),
      merchantCategory: body.merchantCategory,
      categoryId: body.categoryId,
      notes: body.notes?.trim(),
      reference: body.reference?.trim(),
      location: body.location,
      latitude: body.latitude,
      longitude: body.longitude,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    };

    const [newTransaction] = await db.insert(transactions).values(transactionData).returning();

    // Handle splits if provided
    if (body.splits && Array.isArray(body.splits) && body.splits.length > 0) {
      const splitData: NewTransactionSplit[] = body.splits.map((split: any, index: number) => ({
        transactionId: newTransaction.id,
        amount: Math.abs(split.amount),
        categoryId: split.categoryId,
        description: split.description?.trim(),
        sortOrder: index,
      }));
      await db.insert(transactionSplits).values(splitData);
    }

    // Handle tags if provided
    if (body.tagIds && Array.isArray(body.tagIds) && body.tagIds.length > 0) {
      const tagData = body.tagIds.map((tagId: string) => ({
        transactionId: newTransaction.id,
        tagId,
      }));
      await db.insert(transactionTags).values(tagData);
    }

    // Update account balance
    const balanceChange = body.type === 'income'
      ? newTransaction.amount
      : body.type === 'expense'
        ? -newTransaction.amount
        : body.type === 'transfer'
          ? -newTransaction.amount // Decrease source account
          : 0;

    if (balanceChange !== 0) {
      await db
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, body.accountId));
    }

    // For transfers, create the corresponding transaction in destination account
    if (body.type === 'transfer' && body.transferAccountId) {
      const [linkedTransaction] = await db.insert(transactions).values({
        ...transactionData,
        accountId: body.transferAccountId,
        transferAccountId: body.accountId,
        linkedTransactionId: newTransaction.id,
        type: 'transfer',
        amount: newTransaction.amount,
      }).returning();

      // Update the original transaction with the linked ID
      await db
        .update(transactions)
        .set({ linkedTransactionId: linkedTransaction.id })
        .where(eq(transactions.id, newTransaction.id));

      // Increase destination account balance
      await db
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${newTransaction.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, body.transferAccountId));
    }

    return created(newTransaction);
  } catch (err) {
    console.error('Error creating transaction:', err);
    return error('Failed to create transaction', 500);
  }
};
