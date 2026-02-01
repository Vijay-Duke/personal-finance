import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, bankAccounts, stocks, cryptoAssets, type NewAccount, type AccountType } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts
 * List all accounts for the authenticated user's household.
 *
 * Query params:
 * - type: Filter by account type (bank_account, stock, crypto, etc.)
 * - active: Filter by active status (true/false)
 * - liquid: Filter by liquidity (true/false)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const typeFilter = url.searchParams.get('type') as AccountType | null;
  const activeFilter = url.searchParams.get('active');
  const liquidFilter = url.searchParams.get('liquid');

  try {
    const conditions = [eq(accounts.householdId, session.user.householdId)];

    if (typeFilter) {
      conditions.push(eq(accounts.type, typeFilter));
    }
    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }
    if (liquidFilter !== null) {
      conditions.push(eq(accounts.isLiquid, liquidFilter === 'true'));
    }

    const result = await db
      .select()
      .from(accounts)
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    return json(result);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    return error('Failed to fetch accounts', 500);
  }
};

/**
 * POST /api/accounts
 * Create a new account.
 *
 * Request body:
 * - name: string (required)
 * - type: AccountType (required)
 * - currency: string (default: 'USD')
 * - currentBalance: number (default: 0)
 * - isLiquid: boolean (default: true)
 * - includeInNetWorth: boolean (default: true)
 * - icon: string (optional)
 * - color: string (optional)
 * - notes: string (optional)
 *
 * For bank accounts, also accepts:
 * - bankName: string
 * - accountType: BankAccountType
 * - accountNumber: string (last 4 digits for display)
 * - routingNumber: string
 * - interestRate: number
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
      return error('Account name is required');
    }
    if (!body.type) {
      return error('Account type is required');
    }

    // Create base account
    const accountData: NewAccount = {
      householdId: session.user.householdId,
      name: body.name.trim(),
      type: body.type,
      currency: body.currency || 'USD',
      currentBalance: body.currentBalance || 0,
      isActive: body.isActive ?? true,
      isLiquid: body.isLiquid ?? true,
      includeInNetWorth: body.includeInNetWorth ?? true,
      expectedAnnualReturnRate: body.expectedAnnualReturnRate,
      icon: body.icon,
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    };

    // Insert account and get the ID
    const [newAccount] = await db.insert(accounts).values(accountData).returning();

    // Create type-specific record if applicable
    if (body.type === 'bank_account' && body.bankDetails) {
      await db.insert(bankAccounts).values({
        accountId: newAccount.id,
        bankName: body.bankDetails.bankName,
        accountType: body.bankDetails.accountType || 'checking',
        accountNumber: body.bankDetails.accountNumber,
        routingNumber: body.bankDetails.routingNumber,
        interestRate: body.bankDetails.interestRate || 0,
      });
    } else if (body.type === 'stock' && body.stockDetails) {
      await db.insert(stocks).values({
        accountId: newAccount.id,
        symbol: body.stockDetails.symbol,
        exchange: body.stockDetails.exchange,
        securityName: body.stockDetails.securityName,
        shares: body.stockDetails.shares || 0,
        avgCostBasis: body.stockDetails.avgCostBasis || 0,
        totalCostBasis: body.stockDetails.totalCostBasis || 0,
        broker: body.stockDetails.broker,
        brokerAccountId: body.stockDetails.brokerAccountId,
      });
    } else if (body.type === 'crypto' && body.cryptoDetails) {
      await db.insert(cryptoAssets).values({
        accountId: newAccount.id,
        symbol: body.cryptoDetails.symbol,
        name: body.cryptoDetails.name,
        coingeckoId: body.cryptoDetails.coingeckoId,
        network: body.cryptoDetails.network,
        holdings: body.cryptoDetails.holdings || 0,
        avgCostBasis: body.cryptoDetails.avgCostBasis || 0,
        totalCostBasis: body.cryptoDetails.totalCostBasis || 0,
        storageType: body.cryptoDetails.storageType,
        exchangeName: body.cryptoDetails.exchangeName,
        walletAddress: body.cryptoDetails.walletAddress,
        walletName: body.cryptoDetails.walletName,
      });
    }

    return created(newAccount);
  } catch (err) {
    console.error('Error creating account:', err);
    return error('Failed to create account', 500);
  }
};
