import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, superannuationAccounts, type NewSuperannuationAccount } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/superannuation
 * List all superannuation/retirement accounts with their details.
 *
 * Query params:
 * - active: Filter by active status (true/false)
 * - superType: Filter by super type
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const activeFilter = url.searchParams.get('active');
  const superTypeFilter = url.searchParams.get('superType');

  try {
    const conditions = [
      eq(accounts.householdId, session.user.householdId),
      eq(accounts.type, 'superannuation'),
    ];

    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }

    // Join accounts with superannuation details
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
        // Superannuation-specific fields
        superId: superannuationAccounts.id,
        superType: superannuationAccounts.superType,
        fundName: superannuationAccounts.fundName,
        memberNumber: superannuationAccounts.memberNumber,
        employerContributionRate: superannuationAccounts.employerContributionRate,
        employeeContributionRate: superannuationAccounts.employeeContributionRate,
        investmentOption: superannuationAccounts.investmentOption,
        hasLifeInsurance: superannuationAccounts.hasLifeInsurance,
        lifeInsuranceCover: superannuationAccounts.lifeInsuranceCover,
        preservationAge: superannuationAccounts.preservationAge,
        taxFreeComponent: superannuationAccounts.taxFreeComponent,
        taxableComponent: superannuationAccounts.taxableComponent,
        preTaxBalance: superannuationAccounts.preTaxBalance,
      })
      .from(accounts)
      .leftJoin(superannuationAccounts, eq(accounts.id, superannuationAccounts.accountId))
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    // Filter by super type if specified
    const filtered = superTypeFilter
      ? results.filter(r => r.superType === superTypeFilter)
      : results;

    // Calculate projections
    const enriched = filtered.map(super_ => {
      const totalContributionRate = (super_.employerContributionRate || 0) + (super_.employeeContributionRate || 0);

      return {
        ...super_,
        totalContributionRate,
        // Simple projection: current balance growing at 7% p.a. for years until preservation age
        // This is a placeholder - real projections would be more sophisticated
      };
    });

    return json(enriched);
  } catch (err) {
    console.error('Error fetching superannuation accounts:', err);
    return error('Failed to fetch superannuation accounts', 500);
  }
};

/**
 * POST /api/accounts/superannuation
 * Create a new superannuation account.
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

    const name = body.name.trim();
    const currentBalance = body.currentBalance || 0;

    // Create base account
    const [newAccount] = await db.insert(accounts).values({
      householdId: session.user.householdId,
      name,
      type: 'superannuation',
      currency: body.currency || 'AUD',
      currentBalance,
      isActive: body.isActive ?? true,
      isLiquid: false,
      includeInNetWorth: body.includeInNetWorth ?? true,
      icon: body.icon || 'landmark',
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    }).returning();

    // Create superannuation details
    const superData: NewSuperannuationAccount = {
      accountId: newAccount.id,
      superType: body.superType || 'super_accumulation',
      fundName: body.fundName,
      memberNumber: body.memberNumber,
      employerContributionRate: body.employerContributionRate,
      employeeContributionRate: body.personalContributionRate,
      investmentOption: body.investmentOption,
      hasLifeInsurance: body.hasLifeInsurance ?? false,
      lifeInsuranceCover: body.lifeInsuranceCover,
      preservationAge: body.preservationAge,
      taxFreeComponent: body.taxFreeComponent,
      taxableComponent: body.taxableComponent,
      preTaxBalance: body.preTaxBalance,
    };

    const [superDetail] = await db.insert(superannuationAccounts).values(superData).returning();

    return created({
      ...newAccount,
      ...superDetail,
    });
  } catch (err) {
    console.error('Error creating superannuation account:', err);
    return error('Failed to create superannuation account', 500);
  }
};
