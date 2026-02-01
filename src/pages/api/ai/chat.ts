import type { APIRoute } from 'astro';
import { streamText, type CoreMessage } from 'ai';
import { db } from '../../../lib/db';
import { aiConversations, aiProviders } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized, validationError } from '../../../lib/api/response';
import { getDefaultProvider, createLanguageModelFromProvider } from '../../../lib/ai/provider';
import { buildFinancialContext, buildSystemPrompt } from '../../../lib/ai/context-builder';

/**
 * POST /api/ai/chat
 * Send a message to the AI and get a streaming response.
 *
 * Request body:
 * - message: string (required) - The user's message
 * - conversationId: string (optional) - Existing conversation ID
 * - providerId: string (optional) - Specific AI provider to use
 * - systemPrompt: string (optional) - Custom system prompt override
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
    if (!body.message?.trim()) {
      return validationError({ message: 'Message is required' });
    }

    const userMessage = body.message.trim();

    // Get or create conversation
    let conversationId = body.conversationId;
    let conversation = null;
    let existingMessages: CoreMessage[] = [];

    if (conversationId) {
      // Verify conversation exists and belongs to user
      const [existing] = await db
        .select()
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.id, conversationId),
            eq(aiConversations.householdId, user.householdId!),
            eq(aiConversations.userId, user.id)
          )
        );

      if (!existing) {
        return error('Conversation not found', 404);
      }

      conversation = existing;
      existingMessages = (existing.messages as CoreMessage[]) || [];
    }

    // Get AI provider
    let provider = null;

    if (body.providerId) {
      // Use specified provider
      const [specified] = await db
        .select()
        .from(aiProviders)
        .where(
          and(
            eq(aiProviders.id, body.providerId),
            eq(aiProviders.householdId, user.householdId!),
            eq(aiProviders.isActive, true)
          )
        );

      if (!specified) {
        return error('AI provider not found or inactive', 404);
      }

      provider = specified;
    } else {
      // Use default provider
      provider = await getDefaultProvider(user.householdId!);
    }

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

    // Build system prompt
    const systemPrompt = body.systemPrompt || buildSystemPrompt(financialContext);

    // Prepare messages
    const messages: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...existingMessages,
      { role: 'user', content: userMessage },
    ];

    // Create language model
    const model = createLanguageModelFromProvider(provider);

    // Create conversation if it doesn't exist
    if (!conversationId) {
      // Generate a title from the first message (truncated)
      const title = userMessage.length > 50
        ? userMessage.substring(0, 47) + '...'
        : userMessage;

      const [newConversation] = await db
        .insert(aiConversations)
        .values({
          householdId: user.householdId!,
          userId: user.id,
          title: title,
          messages: [{ role: 'user', content: userMessage, timestamp: new Date().toISOString() }],
        })
        .returning();

      conversationId = newConversation.id;
      conversation = newConversation;
    } else {
      // Add user message to existing conversation
      const updatedMessages = [
        ...existingMessages,
        { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      ];

      await db
        .update(aiConversations)
        .set({
          messages: updatedMessages,
          updatedAt: new Date(),
        })
        .where(eq(aiConversations.id, conversationId));
    }

    // Stream the response
    const result = streamText({
      model,
      messages,
      async onFinish({ text }) {
        // Save assistant response to conversation
        try {
          const [current] = await db
            .select({ messages: aiConversations.messages })
            .from(aiConversations)
            .where(eq(aiConversations.id, conversationId));

          if (current) {
            const currentMessages = (current.messages as CoreMessage[]) || [];
            const updatedMessages = [
              ...currentMessages,
              { role: 'assistant', content: text, timestamp: new Date().toISOString() },
            ];

            await db
              .update(aiConversations)
              .set({
                messages: updatedMessages,
                updatedAt: new Date(),
              })
              .where(eq(aiConversations.id, conversationId));
          }
        } catch (err) {
          console.error('Error saving assistant response:', err);
        }
      },
    });

    // Return streaming response with conversation ID header
    const response = result.toDataStreamResponse();
    response.headers.set('X-Conversation-Id', conversationId);

    return response;
  } catch (err) {
    console.error('Error in AI chat:', err);

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

    return error('Failed to process chat request', 500);
  }
};

/**
 * GET /api/ai/chat
 * Get chat status or validate configuration.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    // Check if any providers are configured
    const providers = await db
      .select({
        id: aiProviders.id,
        name: aiProviders.name,
        provider: aiProviders.provider,
        model: aiProviders.model,
        isDefault: aiProviders.isDefault,
        isActive: aiProviders.isActive,
      })
      .from(aiProviders)
      .where(eq(aiProviders.householdId, session.user.householdId));

    const defaultProvider = providers.find((p) => p.isDefault && p.isActive) ||
                           providers.find((p) => p.isActive);

    return json({
      configured: providers.length > 0,
      hasActiveProvider: providers.some((p) => p.isActive),
      defaultProvider: defaultProvider
        ? {
            id: defaultProvider.id,
            name: defaultProvider.name,
            provider: defaultProvider.provider,
            model: defaultProvider.model,
          }
        : null,
      totalProviders: providers.length,
    });
  } catch (err) {
    console.error('Error checking chat status:', err);
    return error('Failed to check chat status', 500);
  }
};
