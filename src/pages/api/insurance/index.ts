import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { insurancePolicies, type NewInsurancePolicy } from '../../../lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/insurance
 * List all insurance policies for the current household.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');

  try {
    const conditions = [eq(insurancePolicies.householdId, session.user.householdId)];

    if (type) {
      conditions.push(eq(insurancePolicies.type, type as any));
    }
    if (status) {
      conditions.push(eq(insurancePolicies.status, status as any));
    }

    const results = await db
      .select()
      .from(insurancePolicies)
      .where(and(...conditions))
      .orderBy(asc(insurancePolicies.type), asc(insurancePolicies.name));

    // Calculate annual premium for each policy
    const policiesWithAnnual = results.map(policy => {
      let annualPremium = policy.premiumAmount;
      switch (policy.premiumFrequency) {
        case 'monthly':
          annualPremium = policy.premiumAmount * 12;
          break;
        case 'quarterly':
          annualPremium = policy.premiumAmount * 4;
          break;
        case 'semi_annual':
          annualPremium = policy.premiumAmount * 2;
          break;
        case 'annual':
          annualPremium = policy.premiumAmount;
          break;
      }
      return {
        ...policy,
        annualPremium,
      };
    });

    return json(policiesWithAnnual);
  } catch (err) {
    console.error('Error fetching insurance policies:', err);
    return error('Failed to fetch insurance policies', 500);
  }
};

/**
 * POST /api/insurance
 * Create a new insurance policy.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    if (!body.name?.trim()) {
      return error('Policy name is required');
    }
    if (!body.type) {
      return error('Policy type is required');
    }
    if (!body.provider?.trim()) {
      return error('Provider is required');
    }
    if (body.premiumAmount === undefined || body.premiumAmount === null) {
      return error('Premium amount is required');
    }

    const newPolicy: NewInsurancePolicy = {
      householdId: session.user.householdId,
      name: body.name.trim(),
      type: body.type,
      status: body.status || 'active',
      policyNumber: body.policyNumber?.trim(),
      provider: body.provider.trim(),
      coverageAmount: body.coverageAmount,
      deductible: body.deductible,
      currency: body.currency || 'USD',
      premiumAmount: body.premiumAmount,
      premiumFrequency: body.premiumFrequency || 'monthly',
      nextPremiumDate: body.nextPremiumDate ? new Date(body.nextPremiumDate) : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      renewalDate: body.renewalDate ? new Date(body.renewalDate) : undefined,
      linkedAssetIds: body.linkedAssetIds ? JSON.stringify(body.linkedAssetIds) : undefined,
      beneficiaries: body.beneficiaries ? JSON.stringify(body.beneficiaries) : undefined,
      agentName: body.agentName?.trim(),
      agentPhone: body.agentPhone?.trim(),
      agentEmail: body.agentEmail?.trim(),
      notes: body.notes?.trim(),
      documentUrl: body.documentUrl?.trim(),
    };

    const [result] = await db.insert(insurancePolicies).values(newPolicy).returning();

    return created(result);
  } catch (err) {
    console.error('Error creating insurance policy:', err);
    return error('Failed to create insurance policy', 500);
  }
};
