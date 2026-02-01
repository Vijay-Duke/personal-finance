import type { APIRoute } from 'astro';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { categories, type Category } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized, validationError } from '../../../lib/api/response';
import { getDefaultProvider, createLanguageModelFromProvider } from '../../../lib/ai/provider';

/**
 * Categorization result schema.
 */
const categorizationResultSchema = z.object({
  categoryId: z.string().nullable().describe('The ID of the suggested category, or null if uncertain'),
  categoryName: z.string().describe('The name of the suggested category'),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
  reasoning: z.string().describe('Brief explanation for the categorization'),
  alternativeCategories: z.array(z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    confidence: z.number().min(0).max(1),
  })).optional().describe('Alternative category suggestions'),
});

export type CategorizationResult = z.infer<typeof categorizationResultSchema>;

/**
 * POST /api/ai/categorize
 * Auto-categorize a transaction using AI.
 *
 * Request body:
 * - description: string (required) - Transaction description
 * - amount: number (required) - Transaction amount
 * - type: 'income' | 'expense' (optional) - Transaction type hint
 * - accountId: string (optional) - Account ID for context
 * - date: string (optional) - Transaction date for context
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { user } = session;

  try {
    const body = await context.request.json();

    // Validate request
    if (!body.description?.trim()) {
      return validationError({ description: 'Transaction description is required' });
    }

    if (typeof body.amount !== 'number') {
      return validationError({ amount: 'Transaction amount is required and must be a number' });
    }

    const description = body.description.trim();
    const amount = body.amount;
    const type = body.type || (amount >= 0 ? 'income' : 'expense');

    // Get AI provider
    const provider = await getDefaultProvider(user.householdId!);
    if (!provider) {
      return error(
        'No AI provider configured. Please set up an AI provider in settings.',
        400
      );
    }

    // Fetch user's categories
    const userCategories = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.householdId, user.householdId!),
          eq(categories.type, type)
        )
      );

    if (userCategories.length === 0) {
      return error(
        `No ${type} categories found. Please create categories before using auto-categorization.`,
        400
      );
    }

    // Create language model
    const model = createLanguageModelFromProvider(provider);

    // Build categorization prompt
    const prompt = buildCategorizationPrompt({
      description,
      amount,
      type,
      categories: userCategories,
      accountId: body.accountId,
      date: body.date,
    });

    // Generate categorization using structured output
    const result = await generateText({
      model,
      output: Output.object({ schema: categorizationResultSchema }),
      prompt,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    // Extract the structured output
    const suggestion = { ...result.output };

    // Validate that the suggested category exists
    const suggestedCategory = userCategories.find(c => c.id === suggestion.categoryId);
    if (suggestion.categoryId && !suggestedCategory) {
      // Try to match by name if ID doesn't match
      const categoryByName = userCategories.find(
        c => c.name.toLowerCase() === suggestion.categoryName.toLowerCase()
      );
      if (categoryByName) {
        suggestion.categoryId = categoryByName.id;
      }
    }

    return json({
      success: true,
      suggestion,
      availableCategories: userCategories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
      })),
    });
  } catch (err) {
    console.error('Error in AI categorization:', err);

    // Handle specific errors
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

    return error('Failed to categorize transaction', 500);
  }
};

/**
 * GET /api/ai/categorize
 * Get categorization status and available categories.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    // Check if AI provider is configured
    const provider = await getDefaultProvider(session.user.householdId);

    // Get available categories
    const userCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
        icon: categories.icon,
        color: categories.color,
      })
      .from(categories)
      .where(eq(categories.householdId, session.user.householdId));

    return json({
      configured: !!provider,
      categories: userCategories,
      categoryCount: {
        income: userCategories.filter(c => c.type === 'income').length,
        expense: userCategories.filter(c => c.type === 'expense').length,
      },
    });
  } catch (err) {
    console.error('Error checking categorization status:', err);
    return error('Failed to check categorization status', 500);
  }
};

/**
 * Build the categorization prompt.
 */
interface CategorizationPromptParams {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categories: Category[];
  accountId?: string;
  date?: string;
}

function buildCategorizationPrompt(params: CategorizationPromptParams): string {
  const { description, amount, type, categories, date } = params;

  const lines: string[] = [];

  lines.push('You are a financial transaction categorization assistant.');
  lines.push('');
  lines.push('## Transaction Details');
  lines.push(`Description: "${description}"`);
  lines.push(`Amount: ${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`);
  lines.push(`Type: ${type}`);
  if (date) {
    lines.push(`Date: ${date}`);
  }
  lines.push('');

  lines.push('## Available Categories');
  categories.forEach(cat => {
    lines.push(`- ${cat.name} (ID: ${cat.id})`);
  });
  lines.push('');

  lines.push('## Instructions');
  lines.push('1. Analyze the transaction description and amount.');
  lines.push('2. Select the most appropriate category from the list above.');
  lines.push('3. Provide a confidence score (0-1) based on how clear the categorization is.');
  lines.push('4. Explain your reasoning briefly.');
  lines.push('5. If confidence is low (< 0.7), suggest up to 2 alternative categories.');
  lines.push('6. If the transaction is ambiguous or could fit multiple categories equally, set categoryId to null.');
  lines.push('');

  lines.push('Consider common patterns:');
  if (type === 'expense') {
    lines.push('- Grocery stores, supermarkets -> Groceries');
    lines.push('- Restaurants, cafes, food delivery -> Dining Out');
    lines.push('- Gas stations, public transit -> Transportation');
    lines.push('- Rent, mortgage -> Housing');
    lines.push('- Electricity, water, internet -> Utilities');
    lines.push('- Movie theaters, streaming services -> Entertainment');
    lines.push('- Doctor visits, pharmacy -> Healthcare');
    lines.push('- Salary deposits -> should not be expenses');
  } else {
    lines.push('- Salary, wages -> Salary');
    lines.push('- Dividends, interest -> Investments');
    lines.push('- Gifts received -> Gifts');
    lines.push('- Refunds -> may match original expense category');
  }

  return lines.join('\n');
}
