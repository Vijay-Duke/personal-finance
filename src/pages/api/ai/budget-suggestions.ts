import type { APIRoute } from 'astro';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized, validationError } from '../../../lib/api/response';
import { getDefaultProvider, createLanguageModelFromProvider } from '../../../lib/ai/provider';
import { buildFinancialContext, getFinancialHealthSummary } from '../../../lib/ai/context-builder';

/**
 * Budget category suggestion schema.
 */
const budgetCategorySchema = z.object({
  categoryId: z.string().optional().describe('Category ID if matching existing category'),
  categoryName: z.string().describe('Name of the budget category'),
  suggestedAmount: z.number().describe('Suggested monthly budget amount'),
  currentSpending: z.number().optional().describe('Current average monthly spending in this category'),
  rationale: z.string().describe('Explanation for this budget recommendation'),
  priority: z.enum(['essential', 'important', 'discretionary']).describe('Priority level'),
  flexibility: z.enum(['fixed', 'adjustable', 'flexible']).describe('How flexible this budget is'),
});

/**
 * Budget suggestions response schema.
 */
const budgetSuggestionsSchema = z.object({
  totalSuggestedBudget: z.number().describe('Total recommended monthly budget'),
  categories: z.array(budgetCategorySchema).describe('Category-level budget suggestions'),
  savingsTarget: z.object({
    amount: z.number().describe('Recommended monthly savings amount'),
    percentage: z.number().describe('Savings as percentage of income'),
    rationale: z.string(),
  }).describe('Savings recommendations'),
  analysis: z.object({
    currentStatus: z.string().describe('Assessment of current financial situation'),
    opportunities: z.array(z.string()).describe('Key opportunities for improvement'),
    warnings: z.array(z.string()).optional().describe('Potential concerns or warnings'),
  }),
  scenarios: z.array(z.object({
    name: z.string().describe('Scenario name (e.g., "Aggressive Saving", "Balanced")'),
    description: z.string(),
    monthlySavings: z.number(),
    timelineToGoal: z.string().optional(),
    tradeoffs: z.array(z.string()),
  })).optional().describe('Alternative budget scenarios'),
});

export type BudgetCategorySuggestion = z.infer<typeof budgetCategorySchema>;
export type BudgetSuggestionsResponse = z.infer<typeof budgetSuggestionsSchema>;

/**
 * POST /api/ai/budget-suggestions
 * Generate AI-powered budget recommendations.
 *
 * Request body:
 * - targetSavingsRate: number (optional) - Target savings rate as decimal (e.g., 0.2 for 20%)
 * - focus: string[] (optional) - Areas to focus on (debt, savings, investing)
 * - constraints: object (optional) - Budget constraints
 *   - minEmergencyFund: number - Minimum emergency fund in months
 *   - maxDebtToIncome: number - Maximum debt-to-income ratio
 *   - fixedExpenses: number - Known fixed monthly expenses
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { user } = session;

  try {
    const body = await context.request.json().catch(() => ({}));

    // Validate target savings rate if provided
    if (body.targetSavingsRate !== undefined) {
      const rate = parseFloat(body.targetSavingsRate);
      if (isNaN(rate) || rate < 0 || rate > 0.9) {
        return validationError({
          targetSavingsRate: 'Target savings rate must be between 0 and 0.9 (0% to 90%)',
        });
      }
    }

    // Get AI provider
    const provider = await getDefaultProvider(user.householdId!);
    if (!provider) {
      return error(
        'No AI provider configured. Please set up an AI provider in settings.',
        400
      );
    }

    // Build financial context
    const financialContext = await buildFinancialContext(
      user.householdId!,
      user.id,
      {
        includeAccounts: true,
        includeCategories: true,
        includeProfile: true,
        includeDebts: true,
      }
    );

    // Get financial health summary
    const healthSummary = getFinancialHealthSummary(financialContext);

    // Create language model
    const model = createLanguageModelFromProvider(provider);

    // Build budget suggestions prompt
    const prompt = buildBudgetPrompt({
      financialContext,
      healthSummary,
      targetSavingsRate: body.targetSavingsRate,
      focus: body.focus || ['savings', 'debt'],
      constraints: body.constraints,
    });

    // Generate budget suggestions
    const result = await generateObject({
      model,
      schema: budgetSuggestionsSchema,
      prompt,
      temperature: 0.4,
    });

    // Add metadata to response
    const response = {
      success: true,
      data: result.object,
      metadata: {
        generatedAt: new Date().toISOString(),
        targetSavingsRate: body.targetSavingsRate,
        basedOn: {
          annualIncome: financialContext.profile?.annualIncome,
          currentExpenses: financialContext.profile?.estimatedMonthlyExpense,
          netWorth: financialContext.netWorth,
        },
      },
    };

    return json(response);
  } catch (err) {
    console.error('Error generating budget suggestions:', err);

    if (err instanceof Error) {
      if (err.message.includes('API key')) {
        return error('Invalid or missing API key for AI provider', 400);
      }
      if (err.message.includes('model')) {
        return error('Invalid model configuration', 400);
      }
      if (err.message.includes('fetch') || err.message.includes('network')) {
        return error('Failed to connect to AI provider. Please check your configuration.', 503);
      }
    }

    return error('Failed to generate budget suggestions', 500);
  }
};

/**
 * GET /api/ai/budget-suggestions
 * Get budget suggestion status and current financial context.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    // Check if AI provider is configured
    const provider = await getDefaultProvider(session.user.householdId);

    // Get financial context
    const financialContext = await buildFinancialContext(
      session.user.householdId,
      session.user.id,
      {
        includeAccounts: true,
        includeCategories: true,
        includeProfile: true,
        includeDebts: true,
      }
    );

    const healthSummary = getFinancialHealthSummary(financialContext);

    // Calculate some basic budget metrics
    const monthlyIncome = financialContext.profile?.annualIncome
      ? financialContext.profile.annualIncome / 12
      : undefined;

    const currentExpenses = financialContext.profile?.estimatedMonthlyExpense;

    const recommendedSavingsRate = monthlyIncome
      ? healthSummary.savingsRate && healthSummary.savingsRate < 0.2
        ? 0.2
        : healthSummary.savingsRate || 0.2
      : 0.2;

    return json({
      configured: !!provider,
      financialContext: {
        monthlyIncome,
        currentExpenses,
        liquidAssets: financialContext.liquidAssets,
        totalDebt: financialContext.totalDebt,
        netWorth: financialContext.netWorth,
      },
      healthStatus: healthSummary.status,
      recommendations: {
        targetSavingsRate: recommendedSavingsRate,
        emergencyFundTarget: currentExpenses
          ? currentExpenses * 6
          : monthlyIncome
          ? monthlyIncome * 0.5 * 6
          : undefined,
        debtPayoffPriority: healthSummary.debtToIncomeRatio && healthSummary.debtToIncomeRatio > 0.3,
      },
      categoryCount: {
        income: financialContext.incomeCategories.length,
        expense: financialContext.expenseCategories.length,
      },
      focusAreas: [
        { id: 'savings', label: 'Increase Savings', description: 'Focus on building emergency fund and savings' },
        { id: 'debt', label: 'Pay Off Debt', description: 'Prioritize debt repayment' },
        { id: 'investing', label: 'Invest More', description: 'Allocate more to investments' },
        { id: 'spending', label: 'Reduce Spending', description: 'Cut discretionary expenses' },
      ],
    });
  } catch (err) {
    console.error('Error checking budget suggestions status:', err);
    return error('Failed to check budget suggestions status', 500);
  }
};

/**
 * Build the budget suggestions prompt.
 */
interface BudgetPromptParams {
  financialContext: Awaited<ReturnType<typeof buildFinancialContext>>;
  healthSummary: ReturnType<typeof getFinancialHealthSummary>;
  targetSavingsRate?: number;
  focus: string[];
  constraints?: {
    minEmergencyFund?: number;
    maxDebtToIncome?: number;
    fixedExpenses?: number;
  };
}

function buildBudgetPrompt(params: BudgetPromptParams): string {
  const { financialContext, healthSummary, targetSavingsRate, focus, constraints } = params;

  const lines: string[] = [];

  lines.push('You are an expert financial planner AI. Create a personalized budget recommendation based on the user\'s financial situation.');
  lines.push('');

  // Financial context
  lines.push('## Financial Overview');
  lines.push(`Net Worth: $${financialContext.netWorth.toFixed(2)}`);
  lines.push(`Liquid Assets: $${financialContext.liquidAssets.toFixed(2)}`);
  lines.push(`Investment Assets: $${financialContext.investmentAssets.toFixed(2)}`);
  lines.push(`Total Debt: $${financialContext.totalDebt.toFixed(2)}`);

  const monthlyIncome = financialContext.profile?.annualIncome
    ? financialContext.profile.annualIncome / 12
    : undefined;

  if (monthlyIncome) {
    lines.push(`Monthly Income: $${monthlyIncome.toFixed(2)}`);
  }

  if (financialContext.profile?.estimatedMonthlyExpense) {
    lines.push(`Current Monthly Expenses: $${financialContext.profile.estimatedMonthlyExpense.toFixed(2)}`);
  }

  if (financialContext.profile?.essentialMonthlyExpense) {
    lines.push(`Essential Monthly Expenses: $${financialContext.profile.essentialMonthlyExpense.toFixed(2)}`);
  }
  lines.push('');

  // Health metrics
  lines.push('## Financial Health Metrics');
  if (healthSummary.savingsRate !== undefined) {
    lines.push(`Current Savings Rate: ${(healthSummary.savingsRate * 100).toFixed(1)}%`);
  }
  if (healthSummary.debtToIncomeRatio !== undefined) {
    lines.push(`Debt-to-Income Ratio: ${(healthSummary.debtToIncomeRatio * 100).toFixed(1)}%`);
  }
  if (healthSummary.runwayMonths !== undefined) {
    lines.push(`Emergency Fund: ${healthSummary.runwayMonths.toFixed(1)} months`);
  }
  lines.push('');

  // Categories
  if (financialContext.expenseCategories.length > 0) {
    lines.push('## Expense Categories');
    financialContext.expenseCategories.forEach(cat => {
      lines.push(`- ${cat.name}${cat.isSystem ? ' (System)' : ''}`);
    });
    lines.push('');
  }

  // User preferences
  lines.push('## User Preferences');
  if (targetSavingsRate !== undefined) {
    lines.push(`Target Savings Rate: ${(targetSavingsRate * 100).toFixed(0)}%`);
  }
  lines.push(`Focus Areas: ${focus.join(', ')}`);

  if (constraints) {
    lines.push('## Constraints');
    if (constraints.minEmergencyFund) {
      lines.push(`Minimum Emergency Fund: ${constraints.minEmergencyFund} months`);
    }
    if (constraints.maxDebtToIncome) {
      lines.push(`Maximum Debt-to-Income: ${(constraints.maxDebtToIncome * 100).toFixed(0)}%`);
    }
    if (constraints.fixedExpenses) {
      lines.push(`Fixed Expenses: $${constraints.fixedExpenses.toFixed(2)}/month`);
    }
  }
  lines.push('');

  // Instructions
  lines.push('## Instructions');
  lines.push('Create a comprehensive budget recommendation with the following:');
  lines.push('');
  lines.push('1. **Category Budgets**: Suggest monthly amounts for each relevant expense category');
  lines.push('   - Prioritize essential expenses (housing, utilities, groceries, healthcare)');
  lines.push('   - Allocate discretionary spending based on priorities');
  lines.push('   - Consider the user\'s focus areas');
  lines.push('');
  lines.push('2. **Savings Target**: Recommend a monthly savings amount');
  lines.push('   - Aim for at least 20% if possible, but be realistic');
  lines.push('   - If emergency fund is low (< 3 months), prioritize building that first');
  lines.push('   - If debt is high (> 40% DTI), balance savings with debt payoff');
  lines.push('');
  lines.push('3. **Analysis**: Provide honest assessment including:');
  lines.push('   - Current financial status (strengths and weaknesses)');
  lines.push('   - Key opportunities for improvement');
  lines.push('   - Any warnings or concerns');
  lines.push('');
  lines.push('4. **Scenarios**: Offer 2-3 alternative budget scenarios:');
  lines.push('   - Conservative: Lower risk, steady progress');
  lines.push('   - Balanced: Moderate approach');
  lines.push('   - Aggressive: Faster progress but requires more discipline');
  lines.push('');

  // Guidelines
  lines.push('## Guidelines');
  lines.push('- Use the 50/30/20 rule as a baseline (50% needs, 30% wants, 20% savings)');
  lines.push('- Adjust based on the user\'s specific situation and goals');
  lines.push('- Be realistic about spending cuts - drastic changes often fail');
  lines.push('- If income is variable, suggest a conservative baseline');
  lines.push('- Consider tax implications for investment-related suggestions');
  lines.push('- Factor in the user\'s risk tolerance from their profile');
  lines.push('- If they have high-interest debt, prioritize paying that off');
  lines.push('- Emergency fund should cover 3-6 months of essential expenses');
  lines.push('');

  lines.push('Provide specific dollar amounts for all budget categories. Round to the nearest $10 for readability.');

  return lines.join('\n');
}
