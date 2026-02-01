import type { APIRoute } from 'astro';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized, validationError } from '../../../lib/api/response';
import { getDefaultProvider, createLanguageModelFromProvider } from '../../../lib/ai/provider';
import { buildFinancialContext, getFinancialHealthSummary } from '../../../lib/ai/context-builder';

/**
 * Retirement milestone schema.
 */
const retirementMilestoneSchema = z.object({
  age: z.number().describe('Age at this milestone'),
  year: z.number().describe('Calendar year'),
  totalSavings: z.number().describe('Projected total savings'),
  annualIncome: z.number().describe('Projected annual retirement income'),
  withdrawalRate: z.number().describe('Safe withdrawal rate used'),
  milestones: z.array(z.string()).describe('Key achievements at this age'),
});

/**
 * Retirement projection response schema.
 */
const retirementProjectionSchema = z.object({
  summary: z.object({
    currentAge: z.number().describe('Current age'),
    targetRetirementAge: z.number().describe('Target retirement age'),
    yearsToRetirement: z.number().describe('Years until retirement'),
    retirementYear: z.number().describe('Projected retirement year'),
    probabilityOfSuccess: z.number().describe('Probability of not outliving savings (0-1)'),
    confidenceLevel: z.enum(['high', 'medium', 'low']).describe('Confidence in projection'),
  }),
  projections: z.object({
    currentSavings: z.number().describe('Current retirement savings'),
    projectedRetirementSavings: z.number().describe('Savings at retirement'),
    monthlyContributionNeeded: z.number().describe('Monthly contribution needed to reach goal'),
    currentMonthlyContribution: z.number().optional().describe('Current estimated monthly contribution'),
    replacementRate: z.number().describe('Percentage of income replaced in retirement'),
  }),
  scenarios: z.array(z.object({
    name: z.string().describe('Scenario name'),
    description: z.string(),
    retirementAge: z.number(),
    monthlyContribution: z.number(),
    projectedSavings: z.number(),
    annualRetirementIncome: z.number(),
    probability: z.number(),
  })).describe('Different retirement scenarios'),
  milestones: z.array(retirementMilestoneSchema).describe('Key milestones on the path to retirement'),
  risks: z.array(z.object({
    risk: z.string().describe('Risk description'),
    impact: z.enum(['high', 'medium', 'low']),
    mitigation: z.string().describe('How to mitigate this risk'),
  })).optional().describe('Key risks to retirement plan'),
  recommendations: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    action: z.string().describe('Recommended action'),
    impact: z.string().describe('Expected impact'),
    timeline: z.string().describe('When to implement'),
  })).describe('Actionable recommendations'),
});

export type RetirementMilestone = z.infer<typeof retirementMilestoneSchema>;
export type RetirementProjection = z.infer<typeof retirementProjectionSchema>;

/**
 * POST /api/ai/retirement-projection
 * Generate AI-powered retirement projections and analysis.
 *
 * Request body:
 * - currentAge: number (optional) - Override current age
 * - targetRetirementAge: number (optional) - Override target retirement age
 * - expectedReturn: number (optional) - Expected annual return (default: from profile or 0.07)
 * - inflationRate: number (optional) - Expected inflation rate (default: 0.03)
 * - monthlyContribution: number (optional) - Override monthly contribution
 * - desiredIncome: number (optional) - Desired annual retirement income
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { user } = session;

  try {
    const body = await context.request.json().catch(() => ({}));

    // Validate numeric inputs
    const validations: Record<string, string> = {};

    if (body.currentAge !== undefined && (body.currentAge < 18 || body.currentAge > 100)) {
      validations.currentAge = 'Current age must be between 18 and 100';
    }

    if (body.targetRetirementAge !== undefined &&
        (body.targetRetirementAge < 40 || body.targetRetirementAge > 100)) {
      validations.targetRetirementAge = 'Target retirement age must be between 40 and 100';
    }

    if (body.expectedReturn !== undefined &&
        (body.expectedReturn < 0 || body.expectedReturn > 0.2)) {
      validations.expectedReturn = 'Expected return must be between 0 and 0.2 (0% to 20%)';
    }

    if (body.inflationRate !== undefined &&
        (body.inflationRate < 0 || body.inflationRate > 0.1)) {
      validations.inflationRate = 'Inflation rate must be between 0 and 0.1 (0% to 10%)';
    }

    if (Object.keys(validations).length > 0) {
      return validationError(validations);
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

    // Build retirement projection prompt
    const prompt = buildRetirementPrompt({
      financialContext,
      healthSummary,
      currentAge: body.currentAge,
      targetRetirementAge: body.targetRetirementAge,
      expectedReturn: body.expectedReturn,
      inflationRate: body.inflationRate,
      monthlyContribution: body.monthlyContribution,
      desiredIncome: body.desiredIncome,
    });

    // Generate retirement projection
    const result = await generateObject({
      model,
      schema: retirementProjectionSchema,
      prompt,
      temperature: 0.3,
    });

    // Add metadata to response
    const response = {
      success: true,
      data: result.object,
      metadata: {
        generatedAt: new Date().toISOString(),
        assumptions: {
          expectedReturn: body.expectedReturn ?? financialContext.profile?.expectedAnnualReturn ?? 0.07,
          inflationRate: body.inflationRate ?? 0.03,
          lifeExpectancy: 90,
          withdrawalRate: 0.04,
        },
        basedOn: {
          currentSavings: financialContext.investmentAssets + financialContext.liquidAssets * 0.5,
          annualIncome: financialContext.profile?.annualIncome,
          monthlyExpenses: financialContext.profile?.estimatedMonthlyExpense,
        },
      },
    };

    return json(response);
  } catch (err) {
    console.error('Error generating retirement projection:', err);

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

    return error('Failed to generate retirement projection', 500);
  }
};

/**
 * GET /api/ai/retirement-projection
 * Get retirement projection status and current retirement readiness.
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
        includeCategories: false,
        includeProfile: true,
        includeDebts: true,
      }
    );

    const healthSummary = getFinancialHealthSummary(financialContext);

    // Calculate retirement readiness metrics
    const profile = financialContext.profile;
    const targetRetirementAge = profile?.targetRetirementAge ?? 65;
    const expectedReturn = profile?.expectedAnnualReturn ?? 0.07;

    // Estimate current retirement savings (investments + portion of liquid)
    const retirementSavings = financialContext.investmentAssets + financialContext.liquidAssets * 0.5;

    // Estimate monthly contribution (simplified)
    const monthlyIncome = profile?.annualIncome ? profile.annualIncome / 12 : undefined;
    const monthlyExpenses = profile?.estimatedMonthlyExpense;
    const estimatedMonthlyContribution = monthlyIncome && monthlyExpenses
      ? Math.max(0, (monthlyIncome - monthlyExpenses) * 0.5)
      : undefined;

    // Calculate years to retirement (assuming age 30 if unknown)
    const currentAge = 30; // Placeholder - would need to store birth date
    const yearsToRetirement = targetRetirementAge - currentAge;

    // Simple projection (compound interest)
    const projectedSavings = estimatedMonthlyContribution
      ? retirementSavings * Math.pow(1 + expectedReturn, yearsToRetirement) +
        estimatedMonthlyContribution * 12 * ((Math.pow(1 + expectedReturn, yearsToRetirement) - 1) / expectedReturn)
      : retirementSavings * Math.pow(1 + expectedReturn, yearsToRetirement);

    // 4% rule for safe withdrawal
    const safeAnnualIncome = projectedSavings * 0.04;
    const replacementRate = monthlyIncome
      ? (safeAnnualIncome / (monthlyIncome * 12)) * 100
      : undefined;

    return json({
      configured: !!provider,
      readiness: {
        currentSavings: retirementSavings,
        projectedSavings,
        yearsToRetirement,
        targetRetirementAge,
        estimatedMonthlyContribution,
        safeAnnualIncome,
        replacementRate,
      },
      healthStatus: healthSummary.status,
      hasProfile: !!profile,
      profileFields: profile ? {
        hasAnnualIncome: !!profile.annualIncome,
        hasTargetRetirementAge: !!profile.targetRetirementAge,
        hasExpectedReturn: !!profile.expectedAnnualReturn,
        hasRiskTolerance: !!profile.riskTolerance,
      } : null,
      inputs: {
        currentAge: {
          label: 'Current Age',
          type: 'number',
          min: 18,
          max: 100,
          required: true,
        },
        targetRetirementAge: {
          label: 'Target Retirement Age',
          type: 'number',
          min: 40,
          max: 100,
          default: targetRetirementAge,
        },
        expectedReturn: {
          label: 'Expected Annual Return',
          type: 'percentage',
          min: 0,
          max: 20,
          default: expectedReturn * 100,
          description: 'Expected annual investment return (%)',
        },
        inflationRate: {
          label: 'Inflation Rate',
          type: 'percentage',
          min: 0,
          max: 10,
          default: 3,
          description: 'Expected annual inflation (%)',
        },
        monthlyContribution: {
          label: 'Monthly Contribution',
          type: 'currency',
          min: 0,
          default: estimatedMonthlyContribution,
          description: 'Amount you can contribute monthly',
        },
        desiredIncome: {
          label: 'Desired Retirement Income',
          type: 'currency',
          min: 0,
          description: 'Annual income desired in retirement (optional)',
        },
      },
    });
  } catch (err) {
    console.error('Error checking retirement projection status:', err);
    return error('Failed to check retirement projection status', 500);
  }
};

/**
 * Build the retirement projection prompt.
 */
interface RetirementPromptParams {
  financialContext: Awaited<ReturnType<typeof buildFinancialContext>>;
  healthSummary: ReturnType<typeof getFinancialHealthSummary>;
  currentAge?: number;
  targetRetirementAge?: number;
  expectedReturn?: number;
  inflationRate?: number;
  monthlyContribution?: number;
  desiredIncome?: number;
}

function buildRetirementPrompt(params: RetirementPromptParams): string {
  const {
    financialContext,
    healthSummary,
    currentAge = 30,
    targetRetirementAge,
    expectedReturn,
    inflationRate = 0.03,
    monthlyContribution,
    desiredIncome,
  } = params;

  const profile = financialContext.profile;
  const effectiveTargetAge = targetRetirementAge ?? profile?.targetRetirementAge ?? 65;
  const effectiveReturn = expectedReturn ?? profile?.expectedAnnualReturn ?? 0.07;
  const yearsToRetirement = effectiveTargetAge - currentAge;

  const lines: string[] = [];

  lines.push('You are an expert retirement planning AI. Create a comprehensive retirement projection based on the user\'s financial situation.');
  lines.push('');

  // Personal details
  lines.push('## Personal Details');
  lines.push(`Current Age: ${currentAge}`);
  lines.push(`Target Retirement Age: ${effectiveTargetAge}`);
  lines.push(`Years to Retirement: ${yearsToRetirement}`);
  if (profile?.riskTolerance) {
    lines.push(`Risk Tolerance: ${profile.riskTolerance}`);
  }
  lines.push('');

  // Financial overview
  lines.push('## Current Financial Position');
  lines.push(`Net Worth: $${financialContext.netWorth.toFixed(2)}`);
  lines.push(`Liquid Assets: $${financialContext.liquidAssets.toFixed(2)}`);
  lines.push(`Investment Assets: $${financialContext.investmentAssets.toFixed(2)}`);
  lines.push(`Total Debt: $${financialContext.totalDebt.toFixed(2)}`);

  // Retirement savings estimate
  const retirementSavings = financialContext.investmentAssets + financialContext.liquidAssets * 0.5;
  lines.push(`Estimated Retirement Savings: $${retirementSavings.toFixed(2)}`);
  lines.push('');

  // Income and expenses
  if (profile?.annualIncome) {
    lines.push(`Annual Income: $${profile.annualIncome.toFixed(2)}`);
    lines.push(`Monthly Income: $${(profile.annualIncome / 12).toFixed(2)}`);
  }
  if (profile?.estimatedMonthlyExpense) {
    lines.push(`Monthly Expenses: $${profile.estimatedMonthlyExpense.toFixed(2)}`);
    lines.push(`Annual Expenses: $${(profile.estimatedMonthlyExpense * 12).toFixed(2)}`);
  }
  if (profile?.essentialMonthlyExpense) {
    lines.push(`Essential Monthly Expenses: $${profile.essentialMonthlyExpense.toFixed(2)}`);
  }
  lines.push('');

  // Assumptions
  lines.push('## Assumptions');
  lines.push(`Expected Annual Return: ${(effectiveReturn * 100).toFixed(1)}%`);
  lines.push(`Inflation Rate: ${(inflationRate * 100).toFixed(1)}%`);
  lines.push(`Safe Withdrawal Rate: 4% (adjusted for inflation)`);
  lines.push(`Life Expectancy: 90 years`);
  lines.push('');

  // Contribution
  const monthlyIncome = profile?.annualIncome ? profile.annualIncome / 12 : undefined;
  const currentMonthlySavings = monthlyIncome && profile?.estimatedMonthlyExpense
    ? monthlyIncome - profile.estimatedMonthlyExpense
    : undefined;

  lines.push('## Savings');
  if (currentMonthlySavings !== undefined) {
    lines.push(`Current Monthly Savings Capacity: $${currentMonthlySavings.toFixed(2)}`);
  }
  if (monthlyContribution !== undefined) {
    lines.push(`Specified Monthly Contribution: $${monthlyContribution.toFixed(2)}`);
  }
  if (healthSummary.savingsRate !== undefined) {
    lines.push(`Current Savings Rate: ${(healthSummary.savingsRate * 100).toFixed(1)}%`);
  }
  lines.push('');

  if (desiredIncome !== undefined) {
    lines.push(`Desired Retirement Income: $${desiredIncome.toFixed(2)}/year`);
    lines.push('');
  }

  // Instructions
  lines.push('## Instructions');
  lines.push('Generate a comprehensive retirement projection including:');
  lines.push('');
  lines.push('1. **Summary**: Key retirement metrics');
  lines.push('   - Calculate probability of success (not outliving savings)');
  lines.push('   - Assess confidence level based on data completeness');
  lines.push('');
  lines.push('2. **Projections**: Core retirement numbers');
  lines.push('   - Current vs projected retirement savings');
  lines.push('   - Monthly contribution needed to reach goals');
  lines.push('   - Income replacement rate in retirement');
  lines.push('');
  lines.push('3. **Scenarios**: Multiple retirement scenarios');
  lines.push('   - Conservative: Lower returns, higher savings');
  lines.push('   - Moderate: Baseline assumptions');
  lines.push('   - Optimistic: Higher returns, aggressive savings');
  lines.push('   - Early Retirement: What if they retire 5 years earlier?');
  lines.push('');
  lines.push('4. **Milestones**: Key ages and achievements');
  lines.push('   - Every 5 years until retirement');
  lines.push('   - Include savings targets and achievements');
  lines.push('');
  lines.push('5. **Risks**: Potential risks to the plan');
  lines.push('   - Market volatility, longevity, inflation, healthcare costs');
  lines.push('   - Mitigation strategies for each');
  lines.push('');
  lines.push('6. **Recommendations**: Actionable next steps');
  lines.push('   - Prioritized by impact and urgency');
  lines.push('   - Include timeline for implementation');
  lines.push('');

  // Guidelines
  lines.push('## Guidelines');
  lines.push('- Use the 4% rule as baseline for safe withdrawals');
  lines.push('- Assume Social Security replaces 30-40% of income (if US-based)');
  lines.push('- Healthcare costs in retirement: estimate $5,000-7,000/year per person');
  lines.push('- Adjust for risk tolerance (conservative = lower returns, higher savings)');
  lines.push('- Consider tax implications (Roth vs Traditional, tax brackets)');
  lines.push('- Factor in debt payoff before retirement');
  lines.push('- Emergency fund should be separate from retirement savings');
  lines.push('- If savings rate is low (< 15%), prioritize increasing it');
  lines.push('- If nearing retirement (within 10 years), suggest conservative allocations');
  lines.push('');

  lines.push('Be realistic but encouraging. Focus on what they CAN do, not just gaps.');

  return lines.join('\n');
}
