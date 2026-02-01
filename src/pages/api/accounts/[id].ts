import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, bankAccounts, stocks, cryptoAssets } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, noContent, notFound, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/:id
 * Get a single account with its type-specific details.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Account ID is required');
  }

  try {
    // Fetch the base account
    const [account] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.householdId, session.user.householdId)
        )
      );

    if (!account) {
      return notFound('Account not found');
    }

    // Fetch type-specific details
    let details = null;
    if (account.type === 'bank_account') {
      const [bankDetail] = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.accountId, id));
      details = bankDetail;
    } else if (account.type === 'stock') {
      const [stockDetail] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.accountId, id));
      details = stockDetail;
    } else if (account.type === 'crypto') {
      const [cryptoDetail] = await db
        .select()
        .from(cryptoAssets)
        .where(eq(cryptoAssets.accountId, id));
      details = cryptoDetail;
    }

    return json({
      ...account,
      details,
    });
  } catch (err) {
    console.error('Error fetching account:', err);
    return error('Failed to fetch account', 500);
  }
};

/**
 * PUT /api/accounts/:id
 * Update an account and its type-specific details.
 */
export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Account ID is required');
  }

  try {
    // Verify account exists and belongs to household
    const [existing] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('Account not found');
    }

    const body = await context.request.json();

    // Update base account fields
    const updateData: Partial<typeof accounts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.currentBalance !== undefined) updateData.currentBalance = body.currentBalance;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isLiquid !== undefined) updateData.isLiquid = body.isLiquid;
    if (body.includeInNetWorth !== undefined) updateData.includeInNetWorth = body.includeInNetWorth;
    if (body.expectedAnnualReturnRate !== undefined) updateData.expectedAnnualReturnRate = body.expectedAnnualReturnRate;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const [updated] = await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, id))
      .returning();

    // Update type-specific details if provided
    if (existing.type === 'bank_account' && body.bankDetails) {
      await db
        .update(bankAccounts)
        .set({
          ...body.bankDetails,
          updatedAt: new Date(),
        })
        .where(eq(bankAccounts.accountId, id));
    } else if (existing.type === 'stock' && body.stockDetails) {
      await db
        .update(stocks)
        .set({
          ...body.stockDetails,
          updatedAt: new Date(),
        })
        .where(eq(stocks.accountId, id));
    } else if (existing.type === 'crypto' && body.cryptoDetails) {
      await db
        .update(cryptoAssets)
        .set({
          ...body.cryptoDetails,
          updatedAt: new Date(),
        })
        .where(eq(cryptoAssets.accountId, id));
    }

    return json(updated);
  } catch (err) {
    console.error('Error updating account:', err);
    return error('Failed to update account', 500);
  }
};

/**
 * DELETE /api/accounts/:id
 * Delete an account (cascade deletes type-specific record).
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Account ID is required');
  }

  try {
    // Verify account exists and belongs to household
    const [existing] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('Account not found');
    }

    // Delete account (type-specific records cascade delete)
    await db.delete(accounts).where(eq(accounts.id, id));

    return noContent();
  } catch (err) {
    console.error('Error deleting account:', err);
    return error('Failed to delete account', 500);
  }
};
