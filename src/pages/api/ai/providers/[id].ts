import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { aiProviders, type AIProviderType } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../../lib/auth/session';
import { json, error, noContent, notFound, unauthorized, validationError } from '../../../../lib/api/response';
import { encrypt, decrypt } from '../../../../lib/ai/encryption';

/**
 * GET /api/ai/providers/:id
 * Get a single AI provider configuration (without API key).
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Provider ID is required');
  }

  try {
    const [provider] = await db
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
      .where(
        and(
          eq(aiProviders.id, id),
          eq(aiProviders.householdId, session.user.householdId)
        )
      );

    if (!provider) {
      return notFound('AI provider not found');
    }

    return json(provider);
  } catch (err) {
    console.error('Error fetching AI provider:', err);
    return error('Failed to fetch AI provider', 500);
  }
};

/**
 * PUT /api/ai/providers/:id
 * Update an AI provider configuration.
 *
 * Request body:
 * - name: string
 * - model: string
 * - apiKey: string (will be encrypted if provided)
 * - baseUrl: string
 * - isDefault: boolean
 * - isActive: boolean
 */
export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Provider ID is required');
  }

  try {
    // Verify provider exists and belongs to household
    const [existing] = await db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.id, id),
          eq(aiProviders.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('AI provider not found');
    }

    const body = await context.request.json();

    // Validate provider type if provided
    if (body.provider && !['openai', 'anthropic', 'ollama', 'custom'].includes(body.provider)) {
      return validationError({ provider: 'Invalid provider type' });
    }

    // If setting as default, unset any existing default
    if (body.isDefault && !existing.isDefault) {
      await db
        .update(aiProviders)
        .set({ isDefault: false })
        .where(eq(aiProviders.householdId, session.user.householdId));
    }

    // Build update data
    const updateData: Partial<typeof aiProviders.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.provider !== undefined) updateData.provider = body.provider as AIProviderType;
    if (body.model !== undefined) updateData.model = body.model.trim();
    if (body.baseUrl !== undefined) updateData.baseUrl = body.baseUrl.trim() || undefined;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Encrypt and update API key if provided
    if (body.apiKey !== undefined) {
      if (body.apiKey.trim()) {
        updateData.apiKey = encrypt(body.apiKey.trim());
      } else if (body.provider === 'ollama' || existing.provider === 'ollama') {
        // Allow empty API key for Ollama
        updateData.apiKey = undefined;
      }
    }

    const [updated] = await db
      .update(aiProviders)
      .set(updateData)
      .where(eq(aiProviders.id, id))
      .returning();

    // Return without API key
    const { apiKey, ...safeProvider } = updated;
    return json(safeProvider);
  } catch (err) {
    console.error('Error updating AI provider:', err);
    return error('Failed to update AI provider', 500);
  }
};

/**
 * DELETE /api/ai/providers/:id
 * Delete an AI provider configuration.
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Provider ID is required');
  }

  try {
    // Verify provider exists and belongs to household
    const [existing] = await db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.id, id),
          eq(aiProviders.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('AI provider not found');
    }

    // Delete provider
    await db.delete(aiProviders).where(eq(aiProviders.id, id));

    return noContent();
  } catch (err) {
    console.error('Error deleting AI provider:', err);
    return error('Failed to delete AI provider', 500);
  }
};
