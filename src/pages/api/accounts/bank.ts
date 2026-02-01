import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, bankAccounts, type NewBankAccount } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/bank
 * List all bank accounts with their details for the authenticated user's household.
 *
 * Query params:
 * - active: Filter by active status (true/false)
 * - accountType: Filter by bank account type (checking, savings, etc.)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const activeFilter = url.searchParams.get('active');
  const accountTypeFilter = url.searchParams.get('accountType');

  try {
    const conditions = [
      eq(accounts.householdId, session.user.householdId),
      eq(accounts.type, 'bank_account'),
    ];

    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }

    // Join accounts with bank details
    const results = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        currency: accounts.currency,
        currentBalance: accounts.currentBalance,
        isActive: accounts.isActive,
        isLiquid: accounts.isLiquid,
        includeInNetWorth: accounts.includeInNetWorth,
        icon: accounts.icon,
        color: accounts.color,
        sortOrder: accounts.sortOrder,
        notes: accounts.notes,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
        // Bank-specific fields
        bankAccountId: bankAccounts.id,
        bankName: bankAccounts.bankName,
        accountType: bankAccounts.accountType,
        accountNumber: bankAccounts.accountNumber,
        routingNumber: bankAccounts.routingNumber,
        interestRate: bankAccounts.interestRate,
      })
      .from(accounts)
      .leftJoin(bankAccounts, eq(accounts.id, bankAccounts.accountId))
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    // Filter by bank account type if specified
    const filtered = accountTypeFilter
      ? results.filter(r => r.accountType === accountTypeFilter)
      : results;

    return json(filtered);
  } catch (err) {
    console.error('Error fetching bank accounts:', err);
    return error('Failed to fetch bank accounts', 500);
  }
};

/**
 * POST /api/accounts/bank
 * Create a new bank account with details.
 *
 * Request body:
 * - name: string (required)
 * - bankName: string
 * - accountType: 'checking' | 'savings' | 'money_market' | 'cd' | 'other' (default: 'checking')
 * - currency: string (default: 'USD')
 * - currentBalance: number (default: 0)
 * - accountNumber: string (last 4 digits for display)
 * - routingNumber: string
 * - interestRate: number (as decimal, e.g., 0.05 for 5%)
 * - isLiquid: boolean (default: true)
 * - includeInNetWorth: boolean (default: true)
 * - notes: string
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

    // Create base account
    const [newAccount] = await db.insert(accounts).values({
      householdId: session.user.householdId,
      name: body.name.trim(),
      type: 'bank_account',
      currency: body.currency || 'USD',
      currentBalance: body.currentBalance || 0,
      isActive: body.isActive ?? true,
      isLiquid: body.isLiquid ?? true,
      includeInNetWorth: body.includeInNetWorth ?? true,
      icon: body.icon || 'building-bank',
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    }).returning();

    // Create bank account details
    const bankData: NewBankAccount = {
      accountId: newAccount.id,
      bankName: body.bankName,
      accountType: body.accountType || 'checking',
      accountNumber: body.accountNumber,
      routingNumber: body.routingNumber,
      interestRate: body.interestRate || 0,
    };

    const [bankDetail] = await db.insert(bankAccounts).values(bankData).returning();

    return created({
      ...newAccount,
      ...bankDetail,
    });
  } catch (err) {
    console.error('Error creating bank account:', err);
    return error('Failed to create bank account', 500);
  }
};
