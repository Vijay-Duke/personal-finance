import { db } from '../db';
import {
  accounts,
  categories,
  userFinancialProfiles,
  type Account,
  type Category,
  type UserFinancialProfile,
} from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Financial context data structure for AI prompts.
 */
export interface FinancialContext {
  // Household summary
  householdId: string;
  totalAccounts: number;
  totalBalance: number;
  currency: string;

  // Accounts by type
  accounts: {
    liquid: Account[];
    investments: Account[];
    debts: Account[];
    other: Account[];
  };

  // Categories
  incomeCategories: Category[];
  expenseCategories: Category[];

  // User profile
  profile?: UserFinancialProfile;

  // Calculated metrics
  netWorth: number;
  liquidAssets: number;
  totalDebt: number;
  investmentAssets: number;
}

/**
 * Options for building financial context.
 */
export interface BuildContextOptions {
  includeAccounts?: boolean;
  includeCategories?: boolean;
  includeProfile?: boolean;
  includeDebts?: boolean;
}

/**
 * Build financial context for a household.
 * Gracefully handles missing data by returning empty arrays and zero values.
 *
 * @param householdId - The household ID
 * @param userId - Optional user ID for profile lookup
 * @param options - Options for what to include in the context
 * @returns FinancialContext object
 */
export async function buildFinancialContext(
  householdId: string,
  userId?: string,
  options: BuildContextOptions = {}
): Promise<FinancialContext> {
  const {
    includeAccounts = true,
    includeCategories = true,
    includeProfile = true,
    includeDebts = true,
  } = options;

  // Initialize with defaults
  const context: FinancialContext = {
    householdId,
    totalAccounts: 0,
    totalBalance: 0,
    currency: 'USD',
    accounts: {
      liquid: [],
      investments: [],
      debts: [],
      other: [],
    },
    incomeCategories: [],
    expenseCategories: [],
    netWorth: 0,
    liquidAssets: 0,
    totalDebt: 0,
    investmentAssets: 0,
  };

  try {
    // Fetch accounts if requested
    if (includeAccounts) {
      const householdAccounts = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.householdId, householdId),
            eq(accounts.isActive, true)
          )
        );

      context.totalAccounts = householdAccounts.length;

      // Categorize accounts
      for (const account of householdAccounts) {
        const balance = account.currentBalance || 0;

        if (account.type === 'bank_account') {
          context.accounts.liquid.push(account);
          if (account.isLiquid) {
            context.liquidAssets += balance;
          }
        } else if (account.type === 'stock' || account.type === 'crypto') {
          context.accounts.investments.push(account);
          context.investmentAssets += balance;
        } else if (account.type === 'debt') {
          if (includeDebts) {
            context.accounts.debts.push(account);
            context.totalDebt += Math.abs(balance);
          }
        } else {
          context.accounts.other.push(account);
        }

        // Calculate total balance for net worth
        if (account.includeInNetWorth) {
          context.totalBalance += balance;
        }
      }

      // Calculate net worth
      context.netWorth = context.liquidAssets + context.investmentAssets - context.totalDebt;

      // Get primary currency from first account or default to USD
      if (householdAccounts.length > 0 && householdAccounts[0].currency) {
        context.currency = householdAccounts[0].currency;
      }
    }

    // Fetch categories if requested
    if (includeCategories) {
      const householdCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.householdId, householdId));

      context.incomeCategories = householdCategories.filter((c) => c.type === 'income');
      context.expenseCategories = householdCategories.filter((c) => c.type === 'expense');
    }

    // Fetch user profile if requested and userId provided
    if (includeProfile && userId) {
      const [profile] = await db
        .select()
        .from(userFinancialProfiles)
        .where(eq(userFinancialProfiles.userId, userId));

      if (profile) {
        context.profile = profile;
      }
    }
  } catch (error) {
    console.error('Error building financial context:', error);
    // Return context with defaults (graceful degradation)
  }

  return context;
}

/**
 * Format a currency value for display.
 */
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Format financial context as a string for AI prompts.
 *
 * @param context - The financial context
 * @param options - Formatting options
 * @returns Formatted context string
 */
export function formatContextForPrompt(
  context: FinancialContext,
  options: {
    includeDetailedAccounts?: boolean;
    includeCategories?: boolean;
    includeProfile?: boolean;
    maxAccountsToList?: number;
  } = {}
): string {
  const {
    includeDetailedAccounts = true,
    includeCategories = false,
    includeProfile = true,
    maxAccountsToList = 10,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push('=== FINANCIAL CONTEXT ===');
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push(`- Net Worth: ${formatCurrency(context.netWorth, context.currency)}`);
  lines.push(`- Liquid Assets: ${formatCurrency(context.liquidAssets, context.currency)}`);
  lines.push(`- Investment Assets: ${formatCurrency(context.investmentAssets, context.currency)}`);
  if (context.totalDebt > 0) {
    lines.push(`- Total Debt: ${formatCurrency(context.totalDebt, context.currency)}`);
  }
  lines.push(`- Total Accounts: ${context.totalAccounts}`);
  lines.push('');

  // Accounts
  if (includeDetailedAccounts) {
    // Liquid accounts
    if (context.accounts.liquid.length > 0) {
      lines.push('## Liquid Accounts (Cash & Bank)');
      context.accounts.liquid.slice(0, maxAccountsToList).forEach((account) => {
        lines.push(`- ${account.name}: ${formatCurrency(account.currentBalance || 0, context.currency)}`);
      });
      if (context.accounts.liquid.length > maxAccountsToList) {
        lines.push(`- ... and ${context.accounts.liquid.length - maxAccountsToList} more`);
      }
      lines.push('');
    }

    // Investment accounts
    if (context.accounts.investments.length > 0) {
      lines.push('## Investment Accounts');
      context.accounts.investments.slice(0, maxAccountsToList).forEach((account) => {
        lines.push(`- ${account.name}: ${formatCurrency(account.currentBalance || 0, context.currency)}`);
      });
      if (context.accounts.investments.length > maxAccountsToList) {
        lines.push(`- ... and ${context.accounts.investments.length - maxAccountsToList} more`);
      }
      lines.push('');
    }

    // Debt accounts
    if (context.accounts.debts.length > 0) {
      lines.push('## Debt Accounts');
      context.accounts.debts.slice(0, maxAccountsToList).forEach((account) => {
        lines.push(`- ${account.name}: ${formatCurrency(Math.abs(account.currentBalance || 0), context.currency)}`);
      });
      if (context.accounts.debts.length > maxAccountsToList) {
        lines.push(`- ... and ${context.accounts.debts.length - maxAccountsToList} more`);
      }
      lines.push('');
    }

    // Other accounts
    if (context.accounts.other.length > 0) {
      lines.push('## Other Assets');
      context.accounts.other.slice(0, maxAccountsToList).forEach((account) => {
        lines.push(`- ${account.name}: ${formatCurrency(account.currentBalance || 0, context.currency)}`);
      });
      if (context.accounts.other.length > maxAccountsToList) {
        lines.push(`- ... and ${context.accounts.other.length - maxAccountsToList} more`);
      }
      lines.push('');
    }
  }

  // Categories
  if (includeCategories) {
    if (context.incomeCategories.length > 0) {
      lines.push('## Income Categories');
      context.incomeCategories.slice(0, 10).forEach((cat) => {
        lines.push(`- ${cat.name}`);
      });
      lines.push('');
    }

    if (context.expenseCategories.length > 0) {
      lines.push('## Expense Categories');
      context.expenseCategories.slice(0, 10).forEach((cat) => {
        lines.push(`- ${cat.name}`);
      });
      lines.push('');
    }
  }

  // User Profile
  if (includeProfile && context.profile) {
    lines.push('## Financial Profile');

    if (context.profile.annualIncome) {
      lines.push(`- Annual Income: ${formatCurrency(context.profile.annualIncome, context.currency)}`);
    }

    if (context.profile.estimatedMonthlyExpense) {
      lines.push(`- Estimated Monthly Expense: ${formatCurrency(context.profile.estimatedMonthlyExpense, context.currency)}`);
    }

    if (context.profile.essentialMonthlyExpense) {
      lines.push(`- Essential Monthly Expense: ${formatCurrency(context.profile.essentialMonthlyExpense, context.currency)}`);
    }

    if (context.profile.riskTolerance) {
      lines.push(`- Risk Tolerance: ${context.profile.riskTolerance}`);
    }

    if (context.profile.targetRetirementAge) {
      lines.push(`- Target Retirement Age: ${context.profile.targetRetirementAge}`);
    }

    if (context.profile.expectedAnnualReturn) {
      lines.push(`- Expected Annual Return: ${(context.profile.expectedAnnualReturn * 100).toFixed(1)}%`);
    }

    lines.push('');
  }

  lines.push('=== END FINANCIAL CONTEXT ===');

  return lines.join('\n');
}

/**
 * Build a system prompt for financial AI assistants.
 *
 * @param context - The financial context
 * @param additionalInstructions - Optional additional instructions
 * @returns Complete system prompt
 */
export function buildSystemPrompt(
  context: FinancialContext,
  additionalInstructions?: string
): string {
  const parts: string[] = [];

  parts.push('You are a helpful financial assistant. You have access to the following financial information about the user:');
  parts.push('');
  parts.push(formatContextForPrompt(context));
  parts.push('');
  parts.push('Guidelines:');
  parts.push('- Provide clear, actionable financial advice based on the data provided');
  parts.push('- Be concise but thorough in your explanations');
  parts.push('- Always consider the user\'s risk tolerance and financial goals');
  parts.push('- When making projections, explain your assumptions');
  parts.push('- If you need more information to provide accurate advice, ask for it');
  parts.push('- Do not make up or assume data that is not provided in the context');
  parts.push('- Respect user privacy and confidentiality');

  if (additionalInstructions) {
    parts.push('');
    parts.push('Additional Instructions:');
    parts.push(additionalInstructions);
  }

  return parts.join('\n');
}

/**
 * Get a quick summary of financial health.
 *
 * @param context - The financial context
 * @returns Summary object with key metrics
 */
export function getFinancialHealthSummary(context: FinancialContext): {
  status: 'healthy' | 'moderate' | 'at-risk';
  savingsRate?: number;
  debtToIncomeRatio?: number;
  runwayMonths?: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let status: 'healthy' | 'moderate' | 'at-risk' = 'healthy';

  // Calculate savings rate if we have income and expenses
  let savingsRate: number | undefined;
  if (context.profile?.annualIncome && context.profile?.estimatedMonthlyExpense) {
    const annualExpenses = context.profile.estimatedMonthlyExpense * 12;
    savingsRate = (context.profile.annualIncome - annualExpenses) / context.profile.annualIncome;

    if (savingsRate < 0.1) {
      status = 'at-risk';
      recommendations.push('Your savings rate is below 10%. Consider reducing expenses or increasing income.');
    } else if (savingsRate < 0.2) {
      status = 'moderate';
      recommendations.push('Aim to increase your savings rate to at least 20% for better financial security.');
    }
  }

  // Calculate debt-to-income ratio
  let debtToIncomeRatio: number | undefined;
  if (context.profile?.annualIncome && context.totalDebt > 0) {
    debtToIncomeRatio = context.totalDebt / context.profile.annualIncome;

    if (debtToIncomeRatio > 0.4) {
      status = 'at-risk';
      recommendations.push('Your debt-to-income ratio is high. Prioritize paying down high-interest debt.');
    } else if (debtToIncomeRatio > 0.2) {
      if (status === 'healthy') status = 'moderate';
      recommendations.push('Consider accelerating debt payments to improve your financial flexibility.');
    }
  }

  // Calculate runway (months of expenses covered by liquid assets)
  let runwayMonths: number | undefined;
  if (context.profile?.essentialMonthlyExpense && context.profile.essentialMonthlyExpense > 0) {
    runwayMonths = context.liquidAssets / context.profile.essentialMonthlyExpense;

    if (runwayMonths < 3) {
      status = 'at-risk';
      recommendations.push('Your emergency fund covers less than 3 months. Build up liquid savings urgently.');
    } else if (runwayMonths < 6) {
      if (status === 'healthy') status = 'moderate';
      recommendations.push('Aim to build an emergency fund covering 6+ months of essential expenses.');
    }
  }

  // Investment allocation check
  const totalAssets = context.liquidAssets + context.investmentAssets;
  if (totalAssets > 0) {
    const investmentRatio = context.investmentAssets / totalAssets;

    if (investmentRatio < 0.2 && context.liquidAssets > 10000) {
      recommendations.push('You have significant cash reserves. Consider investing more for long-term growth.');
    }
  }

  return {
    status,
    savingsRate,
    debtToIncomeRatio,
    runwayMonths,
    recommendations,
  };
}
