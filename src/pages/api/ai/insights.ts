import type { APIRoute } from 'astro';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized, validationError } from '../../../lib/api/response';
import { getDefaultProvider, createLanguageModelFromProvider } from '../../../lib/ai/provider';
import { buildFinancialContext, getFinancialHealthSummary } from '../../../lib/ai/context-builder';

/**
 * Financial insight schema.
 */
const insightSchema = z.object({
  id: z.string().describe('Unique identifier for the insight'),
  type: z.enum([
    'spending_pattern',
    'saving_opportunity',
    'investment_insight',
    'debt_recommendation',
    'budget_alert',
    'goal_progress',
    'anomaly',
    'general'
  ]).describe('Type of financial insight'),
  title: z.string().describe('Short, catchy title for the insight'),
  description: z.string().describe('Detailed explanation of the insight'),
  impact: z.enum(['high', 'medium', 'low']).describe('Potential financial impact'),
  actionable: z.boolean().describe('Whether the insight has actionable steps'),
  actionItems: z.array(z.object({
    title: z.string(),
    description: z.string(),
    estimatedImpact: z.string().optional().describe('Estimated financial impact (e.g., "Save $50/month")'),
  })).optional().describe('Specific actions the user can take'),
  relatedMetrics: z.object({
    metric: z.string(),
    currentValue: z.string(),
    targetValue: z.string().optional(),
    trend: z.enum(['improving', 'declining', 'stable']).optional(),
  }).optional().describe('Related financial metrics'),
});

const insightsResponseSchema = z.object({
  insights: z.array(insightSchema).describe('List of generated insights'),
  summary: z.string().describe('Brief overall summary of financial health'),
  generatedAt: z.string().describe('ISO timestamp of when insights were generated'),
});

export type Insight = z.infer<typeof insightSchema>;
export type InsightsResponse = z.infer<typeof insightsResponseSchema>;

/**
 * POST /api/ai/insights
 * Generate AI-powered financial insights.
 *
 * Request body:
 * - focus: string[] (optional) - Areas to focus on (spending, saving, investing, debt)
 * - timeframe: string (optional) - Time period to analyze (1m, 3m, 6m, 1y)
 * - maxInsights: number (optional) - Maximum number of insights to generate (default: 5)
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { user } = session;

  try {
    const body = await context.request.json().catch(() => ({}));

    const focus = body.focus || ['spending', 'saving', 'investing'];
    const timeframe = body.timeframe || '3m';
    const maxInsights = Math.min(parseInt(body.maxInsights || '5', 10), 10);

    // Validate focus areas
    const validFocusAreas = ['spending', 'saving', 'investing', 'debt', 'budget', 'goals'];
    const invalidFocus = focus.filter((f: string) => !validFocusAreas.includes(f));
    if (invalidFocus.length > 0) {
      return validationError({
        focus: `Invalid focus areas: ${invalidFocus.join(', ')}. Valid options: ${validFocusAreas.join(', ')}`,
      });
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

    // Build insights prompt
    const prompt = buildInsightsPrompt({
      financialContext,
      healthSummary,
      focus,
      timeframe,
      maxInsights,
    });

    // Generate insights
    const result = await generateObject({
      model,
      schema: insightsResponseSchema,
      prompt,
      temperature: 0.4,
    });

    // Add IDs and timestamp
    const insightsWithIds: InsightsResponse = {
      ...result.object,
      insights: result.object.insights.map((insight, index) => ({
        ...insight,
        id: `insight-${Date.now()}-${index}`,
      })),
      generatedAt: new Date().toISOString(),
    };

    return json({
      success: true,
      data: insightsWithIds,
      healthStatus: healthSummary.status,
      metrics: {
        savingsRate: healthSummary.savingsRate,
        debtToIncomeRatio: healthSummary.debtToIncomeRatio,
        runwayMonths: healthSummary.runwayMonths,
      },
    });
  } catch (err) {
    console.error('Error generating AI insights:', err);

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

    return error('Failed to generate insights', 500);
  }
};

/**
 * GET /api/ai/insights
 * Get insights status and cached insights if available.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    // Check if AI provider is configured
    const provider = await getDefaultProvider(session.user.householdId);

    // Get basic financial health summary
    const financialContext = await buildFinancialContext(
      session.user.householdId,
      session.user.id,
      {
        includeAccounts: true,
        includeCategories: false,
        includeProfile: true,
        includeDebts: true,
      }
    );

    const healthSummary = getFinancialHealthSummary(financialContext);

    return json({
      configured: !!provider,
      healthStatus: healthSummary.status,
      metrics: {
        savingsRate: healthSummary.savingsRate,
        debtToIncomeRatio: healthSummary.debtToIncomeRatio,
        runwayMonths: healthSummary.runwayMonths,
      },
      recommendations: healthSummary.recommendations,
      focusAreas: [
        { id: 'spending', label: 'Spending Analysis', description: 'Identify spending patterns and opportunities' },
        { id: 'saving', label: 'Saving Opportunities', description: 'Find ways to save more money' },
        { id: 'investing', label: 'Investment Insights', description: 'Optimize investment strategy' },
        { id: 'debt', label: 'Debt Management', description: 'Strategies to pay off debt faster' },
        { id: 'budget', label: 'Budget Optimization', description: 'Improve budget allocation' },
        { id: 'goals', label: 'Goal Progress', description: 'Track progress toward financial goals' },
      ],
    });
  } catch (err) {
    console.error('Error checking insights status:', err);
    return error('Failed to check insights status', 500);
  }
};

/**
 * Build the insights generation prompt.
 */
interface InsightsPromptParams {
  financialContext: Awaited<ReturnType<typeof buildFinancialContext>>;
  healthSummary: ReturnType<typeof getFinancialHealthSummary>;
  focus: string[];
  timeframe: string;
  maxInsights: number;
}

function buildInsightsPrompt(params: InsightsPromptParams): string {
  const { financialContext, healthSummary, focus, timeframe, maxInsights } = params;

  const lines: string[] = [];

  lines.push('You are an expert financial advisor AI. Analyze the user\'s financial data and generate personalized insights.');
  lines.push('');

  // Financial context
  lines.push('## Financial Context');
  lines.push(`Net Worth: $${financialContext.netWorth.toFixed(2)}`);
  lines.push(`Liquid Assets: $${financialContext.liquidAssets.toFixed(2)}`);
  lines.push(`Investment Assets: $${financialContext.investmentAssets.toFixed(2)}`);
  lines.push(`Total Debt: $${financialContext.totalDebt.toFixed(2)}`);

  if (financialContext.profile) {
    const p = financialContext.profile;
    if (p.annualIncome) lines.push(`Annual Income: $${p.annualIncome.toFixed(2)}`);
    if (p.estimatedMonthlyExpense) lines.push(`Monthly Expenses: $${p.estimatedMonthlyExpense.toFixed(2)}`);
    if (p.riskTolerance) lines.push(`Risk Tolerance: ${p.riskTolerance}`);
  }
  lines.push('');

  // Health summary
  lines.push('## Financial Health Summary');
  lines.push(`Status: ${healthSummary.status.toUpperCase()}`);
  if (healthSummary.savingsRate !== undefined) {
    lines.push(`Savings Rate: ${(healthSummary.savingsRate * 100).toFixed(1)}%`);
  }
  if (healthSummary.debtToIncomeRatio !== undefined) {
    lines.push(`Debt-to-Income: ${(healthSummary.debtToIncomeRatio * 100).toFixed(1)}%`);
  }
  if (healthSummary.runwayMonths !== undefined) {
    lines.push(`Emergency Fund: ${healthSummary.runwayMonths.toFixed(1)} months`);
  }
  lines.push('');

  // Accounts summary
  if (financialContext.accounts.liquid.length > 0) {
    lines.push('## Liquid Accounts');
    financialContext.accounts.liquid.slice(0, 5).forEach(acc => {
      lines.push(`- ${acc.name}: $${(acc.currentBalance || 0).toFixed(2)}`);
    });
    lines.push('');
  }

  if (financialContext.accounts.investments.length > 0) {
    lines.push('## Investment Accounts');
    financialContext.accounts.investments.slice(0, 5).forEach(acc => {
      lines.push(`- ${acc.name}: $${(acc.currentBalance || 0).toFixed(2)}`);
    });
    lines.push('');
  }

  if (financialContext.accounts.debts.length > 0) {
    lines.push('## Debt Accounts');
    financialContext.accounts.debts.slice(0, 5).forEach(acc => {
      lines.push(`- ${acc.name}: $${Math.abs(acc.currentBalance || 0).toFixed(2)}`);
    });
    lines.push('');
  }

  // Instructions
  lines.push('## Instructions');
  lines.push(`Generate ${maxInsights} personalized financial insights focusing on: ${focus.join(', ')}`);
  lines.push(`Analysis timeframe: ${timeframe}`);
  lines.push('');

  lines.push('For each insight:');
  lines.push('1. Choose an appropriate type based on the content');
  lines.push('2. Write a clear, actionable title (max 60 characters)');
  lines.push('3. Provide a detailed description explaining the insight');
  lines.push('4. Assess the potential financial impact (high/medium/low)');
  lines.push('5. Include 1-3 specific action items when applicable');
  lines.push('6. Reference relevant metrics when possible');
  lines.push('');

  lines.push('Insight type guidelines:');
  lines.push('- spending_pattern: Unusual spending, trends, or patterns detected');
  lines.push('- saving_opportunity: Ways to reduce expenses or increase savings');
  lines.push('- investment_insight: Portfolio optimization, asset allocation, or investment opportunities');
  lines.push('- debt_recommendation: Strategies for debt repayment or consolidation');
  lines.push('- budget_alert: Budget overruns or allocation issues');
  lines.push('- goal_progress: Progress toward financial goals');
  lines.push('- anomaly: Unusual transactions or unexpected changes');
  lines.push('- general: Other useful financial observations');
  lines.push('');

  lines.push('Guidelines for high-quality insights:');
  lines.push('- Be specific and data-driven when possible');
  lines.push('- Prioritize high-impact recommendations');
  lines.push('- Consider the user\'s risk tolerance for investment advice');
  lines.push('- Focus on actionable advice, not just observations');
  lines.push('- Avoid generic advice; tailor to their specific situation');
  lines.push('- If emergency fund is low (< 3 months), prioritize saving recommendations');
  lines.push('- If debt-to-income is high (> 40%), prioritize debt recommendations');
  lines.push('- Consider tax implications where relevant');
  lines.push('');

  lines.push('Provide a brief overall summary (2-3 sentences) of their financial health in the summary field.');

  return lines.join('\n');
}
