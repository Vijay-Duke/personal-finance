import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, debts, type NewDebt } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/debts
 * List all debts with their details.
 *
 * Query params:
 * - active: Filter by active status (true/false)
 * - debtType: Filter by debt type (mortgage, credit_card, etc.)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const activeFilter = url.searchParams.get('active');
  const debtTypeFilter = url.searchParams.get('debtType');

  try {
    const conditions = [
      eq(accounts.householdId, session.user.householdId),
      eq(accounts.type, 'debt'),
    ];

    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }

    // Join accounts with debt details
    const results = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        currency: accounts.currency,
        currentBalance: accounts.currentBalance,
        isActive: accounts.isActive,
        includeInNetWorth: accounts.includeInNetWorth,
        icon: accounts.icon,
        color: accounts.color,
        sortOrder: accounts.sortOrder,
        notes: accounts.notes,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
        // Debt-specific fields
        debtId: debts.id,
        debtType: debts.debtType,
        lender: debts.lender,
        lenderAccountNumber: debts.lenderAccountNumber,
        originalBalance: debts.originalBalance,
        originationDate: debts.originationDate,
        interestRate: debts.interestRate,
        isFixedRate: debts.isFixedRate,
        minimumPayment: debts.minimumPayment,
        paymentFrequency: debts.paymentFrequency,
        paymentDueDay: debts.paymentDueDay,
        autopayEnabled: debts.autopayEnabled,
        termMonths: debts.termMonths,
        maturityDate: debts.maturityDate,
        creditLimit: debts.creditLimit,
        availableCredit: debts.availableCredit,
        linkedPropertyId: debts.linkedPropertyId,
        escrowBalance: debts.escrowBalance,
        includesEscrow: debts.includesEscrow,
        pmiAmount: debts.pmiAmount,
      })
      .from(accounts)
      .leftJoin(debts, eq(accounts.id, debts.accountId))
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    // Filter by debt type if specified
    const filtered = debtTypeFilter
      ? results.filter(r => r.debtType === debtTypeFilter)
      : results;

    // Calculate utilization and payoff metrics
    const enriched = filtered.map(debt => {
      const utilization = debt.creditLimit
        ? (debt.currentBalance / debt.creditLimit) * 100
        : null;

      // Calculate estimated payoff months (simplified)
      let estimatedPayoffMonths: number | null = null;
      if (debt.minimumPayment && debt.interestRate && debt.currentBalance > 0) {
        const monthlyRate = debt.interestRate / 12;
        if (debt.minimumPayment > debt.currentBalance * monthlyRate) {
          estimatedPayoffMonths = Math.ceil(
            -Math.log(1 - (debt.currentBalance * monthlyRate) / debt.minimumPayment) /
            Math.log(1 + monthlyRate)
          );
        }
      }

      return {
        ...debt,
        utilization,
        estimatedPayoffMonths,
        paidOff: (debt.originalBalance || 0) - debt.currentBalance,
        paidOffPercent: debt.originalBalance
          ? ((debt.originalBalance - debt.currentBalance) / debt.originalBalance) * 100
          : 0,
      };
    });

    return json(enriched);
  } catch (err) {
    console.error('Error fetching debts:', err);
    return error('Failed to fetch debts', 500);
  }
};

/**
 * POST /api/accounts/debts
 * Create a new debt account.
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
      return error('Debt name is required');
    }
    if (!body.debtType) {
      return error('Debt type is required');
    }

    const name = body.name.trim();
    const currentBalance = body.currentBalance || body.originalBalance || 0;

    // Create base account
    // Note: Debt balances are stored as positive but represent liabilities
    const [newAccount] = await db.insert(accounts).values({
      householdId: session.user.householdId,
      name,
      type: 'debt',
      currency: body.currency || 'USD',
      currentBalance,
      isActive: body.isActive ?? true,
      isLiquid: false,
      includeInNetWorth: body.includeInNetWorth ?? true,
      icon: body.icon || (body.debtType === 'credit_card' ? 'credit-card' : 'receipt'),
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    }).returning();

    // Create debt details
    const debtData: NewDebt = {
      accountId: newAccount.id,
      debtType: body.debtType,
      lender: body.lender,
      lenderAccountNumber: body.lenderAccountNumber,
      originalBalance: body.originalBalance || currentBalance,
      originationDate: body.originationDate ? new Date(body.originationDate) : undefined,
      interestRate: body.interestRate,
      isFixedRate: body.isFixedRate ?? true,
      minimumPayment: body.minimumPayment,
      paymentFrequency: body.paymentFrequency || 'monthly',
      paymentDueDay: body.paymentDueDay,
      autopayEnabled: body.autopayEnabled ?? false,
      termMonths: body.termMonths,
      maturityDate: body.maturityDate ? new Date(body.maturityDate) : undefined,
      creditLimit: body.creditLimit,
      availableCredit: body.creditLimit ? body.creditLimit - currentBalance : undefined,
      linkedPropertyId: body.linkedPropertyId,
      escrowBalance: body.escrowBalance,
      includesEscrow: body.includesEscrow ?? false,
      pmiAmount: body.pmiAmount,
    };

    const [debtDetail] = await db.insert(debts).values(debtData).returning();

    return created({
      ...newAccount,
      ...debtDetail,
    });
  } catch (err) {
    console.error('Error creating debt:', err);
    return error('Failed to create debt', 500);
  }
};
