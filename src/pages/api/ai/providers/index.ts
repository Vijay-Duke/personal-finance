import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { aiProviders, type NewAIProvider, type AIProviderType } from '../../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../../lib/auth/session';
import { json, error, created, unauthorized, validationError } from '../../../../lib/api/response';
import { encrypt } from '../../../../lib/ai/encryption';

/**
 * GET /api/ai/providers
 * List all AI providers for the authenticated user's household.
 *
 * Query params:
 * - active: Filter by active status (true/false)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const activeFilter = url.searchParams.get('active');

  try {
    const conditions = [eq(aiProviders.householdId, session.user.householdId)];

    if (activeFilter !== null) {
      conditions.push(eq(aiProviders.isActive, activeFilter === 'true'));
    }

    const result = await db
      .select({
        id: aiProviders.id,
        householdId: aiProviders.householdId,
        name: aiProviders.name,
        provider: aiProviders.provider,
        baseUrl: aiProviders.baseUrl,
        model: aiProviders.model,
        isDefault: aiProviders.isDefault,
        isActive: aiProviders.isActive,
        createdAt: aiProviders.createdAt,
        updatedAt: aiProviders.updatedAt,
        // apiKey is intentionally excluded for security
      })
      .from(aiProviders)
      .where(and(...conditions))
      .orderBy(desc(aiProviders.isDefault), desc(aiProviders.updatedAt));

    return json(result);
  } catch (err) {
    console.error('Error fetching AI providers:', err);
    return error('Failed to fetch AI providers', 500);
  }
};

/**
 * POST /api/ai/providers
 * Create a new AI provider configuration.
 *
 * Request body:
 * - name: string (required)
 * - provider: AIProviderType (required)
 * - model: string (required)
 * - apiKey: string (required for non-Ollama providers)
 * - baseUrl: string (optional, for custom/Ollama)
 * - isDefault: boolean (default: false)
 * - isActive: boolean (default: true)
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!body.name?.trim()) {
      errors.name = 'Provider name is required';
    }

    if (!body.provider) {
      errors.provider = 'Provider type is required';
    } else if (!['openai', 'anthropic', 'ollama', 'custom'].includes(body.provider)) {
      errors.provider = 'Invalid provider type';
    }

    if (!body.model?.trim()) {
      errors.model = 'Model name is required';
    }

    // API key is required for all providers except Ollama
    if (body.provider !== 'ollama' && !body.apiKey?.trim()) {
      errors.apiKey = 'API key is required for this provider';
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // If setting as default, unset any existing default
    if (body.isDefault) {
      await db
        .update(aiProviders)
        .set({ isDefault: false })
        .where(eq(aiProviders.householdId, session.user.householdId));
    }

    // Encrypt API key if provided
    let encryptedApiKey: string | undefined;
    if (body.apiKey?.trim()) {
      encryptedApiKey = encrypt(body.apiKey.trim());
    }

    // Create provider configuration
    const providerData: NewAIProvider = {
      householdId: session.user.householdId,
      name: body.name.trim(),
      provider: body.provider as AIProviderType,
      model: body.model.trim(),
      baseUrl: body.baseUrl?.trim() || undefined,
      apiKey: encryptedApiKey,
      isDefault: body.isDefault ?? false,
      isActive: body.isActive ?? true,
    };

    const [newProvider] = await db.insert(aiProviders).values(providerData).returning();

    // Return without API key
    const { apiKey, ...safeProvider } = newProvider;
    return created(safeProvider);
  } catch (err) {
    console.error('Error creating AI provider:', err);
    return error('Failed to create AI provider', 500);
  }
};
