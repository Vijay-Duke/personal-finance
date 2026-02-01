import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  transactions,
  transactionSplits,
  transactionTags,
  accounts,
  categories,
  tags,
} from '../../../lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, noContent, unauthorized, notFound } from '../../../lib/api/response';

/**
 * GET /api/transactions/:id
 * Get a single transaction with all details.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Transaction ID is required');
  }

  try {
    const [transaction] = await db
      .select({
        id: transactions.id,
        householdId: transactions.householdId,
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
        merchantCategory: transactions.merchantCategory,
        categoryId: transactions.categoryId,
        notes: transactions.notes,
        reference: transactions.reference,
        location: transactions.location,
        latitude: transactions.latitude,
        longitude: transactions.longitude,
        importBatchId: transactions.importBatchId,
        externalId: transactions.externalId,
        recurringScheduleId: transactions.recurringScheduleId,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        // Join account
        accountName: accounts.name,
        accountCurrency: accounts.currency,
        // Join category
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.householdId, session.user.householdId)
        )
      );

    if (!transaction) {
      return notFound('Transaction not found');
    }

    // Get splits
    const splits = await db
      .select({
        id: transactionSplits.id,
        amount: transactionSplits.amount,
        categoryId: transactionSplits.categoryId,
        description: transactionSplits.description,
        sortOrder: transactionSplits.sortOrder,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactionSplits)
      .leftJoin(categories, eq(transactionSplits.categoryId, categories.id))
      .where(eq(transactionSplits.transactionId, id))
      .orderBy(transactionSplits.sortOrder);

    // Get tags
    const txTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(transactionTags)
      .innerJoin(tags, eq(transactionTags.tagId, tags.id))
      .where(eq(transactionTags.transactionId, id));

    return json({
      ...transaction,
      splits,
      tags: txTags,
    });
  } catch (err) {
    console.error('Error fetching transaction:', err);
    return error('Failed to fetch transaction', 500);
  }
};

/**
 * PUT /api/transactions/:id
 * Update a transaction.
 */
export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Transaction ID is required');
  }

  try {
    // Fetch existing transaction
    const [existing] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('Transaction not found');
    }

    const body = await context.request.json();

    // Calculate balance change if amount or type changed
    const oldBalanceEffect = existing.type === 'income'
      ? existing.amount
      : existing.type === 'expense'
        ? -existing.amount
        : -existing.amount; // transfer

    const newType = body.type || existing.type;
    const newAmount = body.amount !== undefined ? Math.abs(body.amount) : existing.amount;

    const newBalanceEffect = newType === 'income'
      ? newAmount
      : newType === 'expense'
        ? -newAmount
        : -newAmount; // transfer

    const balanceAdjustment = newBalanceEffect - oldBalanceEffect;

    // Update transaction
    const [updated] = await db
      .update(transactions)
      .set({
        type: body.type || existing.type,
        status: body.status || existing.status,
        amount: newAmount,
        currency: body.currency || existing.currency,
        date: body.date ? new Date(body.date) : existing.date,
        description: body.description !== undefined ? body.description?.trim() : existing.description,
        merchant: body.merchant !== undefined ? body.merchant?.trim() : existing.merchant,
        merchantCategory: body.merchantCategory !== undefined ? body.merchantCategory : existing.merchantCategory,
        categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
        notes: body.notes !== undefined ? body.notes?.trim() : existing.notes,
        reference: body.reference !== undefined ? body.reference?.trim() : existing.reference,
        location: body.location !== undefined ? body.location : existing.location,
        latitude: body.latitude !== undefined ? body.latitude : existing.latitude,
        longitude: body.longitude !== undefined ? body.longitude : existing.longitude,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();

    // Adjust account balance if needed
    if (balanceAdjustment !== 0) {
      await db
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${balanceAdjustment}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, existing.accountId));
    }

    // Update splits if provided
    if (body.splits !== undefined) {
      // Delete existing splits
      await db
        .delete(transactionSplits)
        .where(eq(transactionSplits.transactionId, id));

      // Insert new splits
      if (Array.isArray(body.splits) && body.splits.length > 0) {
        const splitData = body.splits.map((split: any, index: number) => ({
          transactionId: id,
          amount: Math.abs(split.amount),
          categoryId: split.categoryId,
          description: split.description?.trim(),
          sortOrder: index,
        }));
        await db.insert(transactionSplits).values(splitData);
      }
    }

    // Update tags if provided
    if (body.tagIds !== undefined) {
      // Delete existing tags
      await db
        .delete(transactionTags)
        .where(eq(transactionTags.transactionId, id));

      // Insert new tags
      if (Array.isArray(body.tagIds) && body.tagIds.length > 0) {
        const tagData = body.tagIds.map((tagId: string) => ({
          transactionId: id,
          tagId,
        }));
        await db.insert(transactionTags).values(tagData);
      }
    }

    return json(updated);
  } catch (err) {
    console.error('Error updating transaction:', err);
    return error('Failed to update transaction', 500);
  }
};

/**
 * DELETE /api/transactions/:id
 * Delete a transaction.
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Transaction ID is required');
  }

  try {
    // Fetch existing transaction
    const [existing] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('Transaction not found');
    }

    // Calculate balance reversal
    const balanceReversal = existing.type === 'income'
      ? -existing.amount
      : existing.type === 'expense'
        ? existing.amount
        : existing.amount; // transfer - add back to source account

    // Delete the transaction (splits and tags cascade)
    await db.delete(transactions).where(eq(transactions.id, id));

    // Revert account balance
    if (balanceReversal !== 0) {
      await db
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${balanceReversal}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, existing.accountId));
    }

    // If it's a transfer, also delete/update the linked transaction
    if (existing.linkedTransactionId) {
      const [linkedTx] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, existing.linkedTransactionId));

      if (linkedTx) {
        await db.delete(transactions).where(eq(transactions.id, linkedTx.id));

        // Revert destination account balance
        await db
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} - ${linkedTx.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, linkedTx.accountId));
      }
    }

    return noContent();
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return error('Failed to delete transaction', 500);
  }
};
