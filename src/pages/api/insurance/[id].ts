import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { insurancePolicies } from '../../../lib/db/schema';
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
    return error('Policy ID is required');
  }

  try {
    const [policy] = await db
      .select()
      .from(insurancePolicies)
      .where(
        and(
          eq(insurancePolicies.id, id),
          eq(insurancePolicies.householdId, session.user.householdId)
        )
      );

    if (!policy) {
      return notFound('Insurance policy not found');
    }

    // Calculate annual premium
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
    }

    return json({
      ...policy,
      annualPremium,
    });
  } catch (err) {
    console.error('Error fetching insurance policy:', err);
    return error('Failed to fetch insurance policy', 500);
  }
};

export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Policy ID is required');
  }

  try {
    const body = await context.request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.policyNumber !== undefined) updateData.policyNumber = body.policyNumber?.trim() || null;
    if (body.provider !== undefined) updateData.provider = body.provider.trim();
    if (body.coverageAmount !== undefined) updateData.coverageAmount = body.coverageAmount;
    if (body.deductible !== undefined) updateData.deductible = body.deductible;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.premiumAmount !== undefined) updateData.premiumAmount = body.premiumAmount;
    if (body.premiumFrequency !== undefined) updateData.premiumFrequency = body.premiumFrequency;
    if (body.nextPremiumDate !== undefined) updateData.nextPremiumDate = body.nextPremiumDate ? new Date(body.nextPremiumDate) : null;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.renewalDate !== undefined) updateData.renewalDate = body.renewalDate ? new Date(body.renewalDate) : null;
    if (body.linkedAssetIds !== undefined) updateData.linkedAssetIds = body.linkedAssetIds ? JSON.stringify(body.linkedAssetIds) : null;
    if (body.beneficiaries !== undefined) updateData.beneficiaries = body.beneficiaries ? JSON.stringify(body.beneficiaries) : null;
    if (body.agentName !== undefined) updateData.agentName = body.agentName?.trim() || null;
    if (body.agentPhone !== undefined) updateData.agentPhone = body.agentPhone?.trim() || null;
    if (body.agentEmail !== undefined) updateData.agentEmail = body.agentEmail?.trim() || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.documentUrl !== undefined) updateData.documentUrl = body.documentUrl?.trim() || null;

    const [result] = await db
      .update(insurancePolicies)
      .set(updateData)
      .where(
        and(
          eq(insurancePolicies.id, id),
          eq(insurancePolicies.householdId, session.user.householdId)
        )
      )
      .returning();

    if (!result) {
      return notFound('Insurance policy not found');
    }

    return json(result);
  } catch (err) {
    console.error('Error updating insurance policy:', err);
    return error('Failed to update insurance policy', 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const id = context.params.id;
  if (!id) {
    return error('Policy ID is required');
  }

  try {
    await db
      .delete(insurancePolicies)
      .where(
        and(
          eq(insurancePolicies.id, id),
          eq(insurancePolicies.householdId, session.user.householdId)
        )
      );

    return noContent();
  } catch (err) {
    console.error('Error deleting insurance policy:', err);
    return error('Failed to delete insurance policy', 500);
  }
};
