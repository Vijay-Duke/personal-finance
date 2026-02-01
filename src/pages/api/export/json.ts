import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  transactions,
  accounts,
  categories,
  tags,
  transactionTags,
  budgets,
  goals,
  insurancePolicies,
  dataSources,
  aiProviders,
} from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { error, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/export/json
 * Export all household data as JSON.
 *
 * Query params:
 * - include: Comma-separated list of data types to include
 *   (transactions, accounts, budgets, goals, insurance, dataSources, aiProviders)
 * - startDate: Filter transactions from date (ISO string)
 * - endDate: Filter transactions to date (ISO string)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const includeParam = url.searchParams.get('include') || 'all';
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  const include = includeParam === 'all'
    ? ['transactions', 'accounts', 'categories', 'tags', 'budgets', 'goals', 'insurance', 'dataSources', 'aiProviders']
    : includeParam.split(',').map(s => s.trim());

  const householdId = session.user.householdId;
  const exportData: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    householdId,
    version: '1.0',
  };

  try {
    // Export accounts
    if (include.includes('accounts')) {
      const accountsData = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          type: accounts.type,
          currency: accounts.currency,
          currentBalance: accounts.currentBalance,
          isActive: accounts.isActive,
          isLiquid: accounts.isLiquid,
          includeInNetWorth: accounts.includeInNetWorth,
          expectedAnnualReturnRate: accounts.expectedAnnualReturnRate,
          icon: accounts.icon,
          color: accounts.color,
          sortOrder: accounts.sortOrder,
          notes: accounts.notes,
          createdAt: accounts.createdAt,
          updatedAt: accounts.updatedAt,
        })
        .from(accounts)
        .where(eq(accounts.householdId, householdId));

      exportData.accounts = accountsData;
    }

    // Export categories
    if (include.includes('categories')) {
      const categoriesData = await db
        .select({
          id: categories.id,
          name: categories.name,
          type: categories.type,
          color: categories.color,
          icon: categories.icon,
          parentId: categories.parentId,
          isSystem: categories.isSystem,
          sortOrder: categories.sortOrder,
          createdAt: categories.createdAt,
        })
        .from(categories)
        .where(eq(categories.householdId, householdId));

      exportData.categories = categoriesData;
    }

    // Export tags
    if (include.includes('tags')) {
      const tagsData = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
          createdAt: tags.createdAt,
        })
        .from(tags)
        .where(eq(tags.householdId, householdId));

      exportData.tags = tagsData;
    }

    // Export transactions
    if (include.includes('transactions')) {
      const conditions = [eq(transactions.householdId, householdId)];

      if (startDate) {
        conditions.push(eq(transactions.date, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(eq(transactions.date, new Date(endDate)));
      }

      const transactionsData = await db
        .select({
          id: transactions.id,
          accountId: transactions.accountId,
          transferAccountId: transactions.transferAccountId,
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
          createdAt: transactions.createdAt,
          updatedAt: transactions.updatedAt,
        })
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date));

      // Get transaction tags
      const transactionIds = transactionsData.map(t => t.id);
      let transactionTagsData: Record<string, string[]> = {};

      if (transactionIds.length > 0) {
        const allTransactionTags = await db
          .select({
            transactionId: transactionTags.transactionId,
            tagId: transactionTags.tagId,
          })
          .from(transactionTags)
          .innerJoin(tags, eq(transactionTags.tagId, tags.id))
          .where(eq(tags.householdId, householdId));

        transactionTagsData = allTransactionTags.reduce((acc, tt) => {
          if (!acc[tt.transactionId]) acc[tt.transactionId] = [];
          acc[tt.transactionId].push(tt.tagId);
          return acc;
        }, {} as Record<string, string[]>);
      }

      exportData.transactions = transactionsData.map(t => ({
        ...t,
        tagIds: transactionTagsData[t.id] || [],
      }));
    }

    // Export budgets
    if (include.includes('budgets')) {
      const budgetsData = await db
        .select({
          id: budgets.id,
          categoryId: budgets.categoryId,
          amount: budgets.amount,
          currency: budgets.currency,
          period: budgets.period,
          periodStart: budgets.periodStart,
          rolloverEnabled: budgets.rolloverEnabled,
          rolloverAmount: budgets.rolloverAmount,
          alertThreshold: budgets.alertThreshold,
          alertEnabled: budgets.alertEnabled,
          notes: budgets.notes,
          isActive: budgets.isActive,
          createdAt: budgets.createdAt,
          updatedAt: budgets.updatedAt,
        })
        .from(budgets)
        .where(eq(budgets.householdId, householdId));

      exportData.budgets = budgetsData;
    }

    // Export goals
    if (include.includes('goals')) {
      const goalsData = await db
        .select({
          id: goals.id,
          name: goals.name,
          type: goals.type,
          targetAmount: goals.targetAmount,
          currentAmount: goals.currentAmount,
          currency: goals.currency,
          targetDate: goals.targetDate,
          status: goals.status,
          description: goals.description,
          createdAt: goals.createdAt,
          updatedAt: goals.updatedAt,
        })
        .from(goals)
        .where(eq(goals.householdId, householdId));

      exportData.goals = goalsData;
    }

    // Export insurance
    if (include.includes('insurance')) {
      const insuranceData = await db
        .select({
          id: insurancePolicies.id,
          name: insurancePolicies.name,
          provider: insurancePolicies.provider,
          type: insurancePolicies.type,
          status: insurancePolicies.status,
          policyNumber: insurancePolicies.policyNumber,
          coverageAmount: insurancePolicies.coverageAmount,
          deductible: insurancePolicies.deductible,
          premiumAmount: insurancePolicies.premiumAmount,
          premiumFrequency: insurancePolicies.premiumFrequency,
          nextPremiumDate: insurancePolicies.nextPremiumDate,
          currency: insurancePolicies.currency,
          startDate: insurancePolicies.startDate,
          endDate: insurancePolicies.endDate,
          renewalDate: insurancePolicies.renewalDate,
          linkedAssetIds: insurancePolicies.linkedAssetIds,
          beneficiaries: insurancePolicies.beneficiaries,
          agentName: insurancePolicies.agentName,
          agentPhone: insurancePolicies.agentPhone,
          agentEmail: insurancePolicies.agentEmail,
          notes: insurancePolicies.notes,
          documentUrl: insurancePolicies.documentUrl,
          createdAt: insurancePolicies.createdAt,
          updatedAt: insurancePolicies.updatedAt,
        })
        .from(insurancePolicies)
        .where(eq(insurancePolicies.householdId, householdId));

      exportData.insurance = insuranceData;
    }

    // Export data sources
    if (include.includes('dataSources')) {
      const dataSourcesData = await db
        .select({
          id: dataSources.id,
          type: dataSources.type,
          provider: dataSources.provider,
          isEnabled: dataSources.isEnabled,
          syncFrequency: dataSources.syncFrequency,
          lastSyncAt: dataSources.lastSyncAt,
          rateLimitRemaining: dataSources.rateLimitRemaining,
          rateLimitResetAt: dataSources.rateLimitResetAt,
          lastErrorAt: dataSources.lastErrorAt,
          lastErrorMessage: dataSources.lastErrorMessage,
          createdAt: dataSources.createdAt,
          updatedAt: dataSources.updatedAt,
        })
        .from(dataSources)
        .where(eq(dataSources.householdId, householdId));

      exportData.dataSources = dataSourcesData;
    }

    // Export AI providers (without sensitive keys)
    if (include.includes('aiProviders')) {
      const aiProvidersData = await db
        .select({
          id: aiProviders.id,
          name: aiProviders.name,
          provider: aiProviders.provider,
          model: aiProviders.model,
          isDefault: aiProviders.isDefault,
          isActive: aiProviders.isActive,
          createdAt: aiProviders.createdAt,
          updatedAt: aiProviders.updatedAt,
        })
        .from(aiProviders)
        .where(eq(aiProviders.householdId, householdId));

      exportData.aiProviders = aiProvidersData;
    }

    // Return as downloadable JSON file
    const filename = `finance-export-${new Date().toISOString().split('T')[0]}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Error exporting data:', err);
    return error('Failed to export data', 500);
  }
};
