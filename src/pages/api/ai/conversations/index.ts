import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { aiConversations, type NewAIConversation } from '../../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../../lib/auth/session';
import { json, error, created, unauthorized, validationError } from '../../../../lib/api/response';

/**
 * GET /api/ai/conversations
 * List all AI conversations for the authenticated user.
 *
 * Query params:
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    const result = await db
      .select({
        id: aiConversations.id,
        householdId: aiConversations.householdId,
        userId: aiConversations.userId,
        title: aiConversations.title,
        createdAt: aiConversations.createdAt,
        updatedAt: aiConversations.updatedAt,
        // messages are excluded from list view for performance
      })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.householdId, session.user.householdId),
          eq(aiConversations.userId, session.user.id)
        )
      )
      .orderBy(desc(aiConversations.updatedAt))
      .limit(limit)
      .offset(offset);

    return json(result);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return error('Failed to fetch conversations', 500);
  }
};

/**
 * POST /api/ai/conversations
 * Create a new AI conversation.
 *
 * Request body:
 * - title: string (optional, defaults to "New Conversation")
 * - messages: AIMessage[] (optional, defaults to empty array)
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    // Validate messages if provided
    if (body.messages !== undefined) {
      if (!Array.isArray(body.messages)) {
        return validationError({ messages: 'Messages must be an array' });
      }

      // Validate message structure
      for (let i = 0; i < body.messages.length; i++) {
        const msg = body.messages[i];
        if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
          return validationError({ messages: `Invalid role for message at index ${i}` });
        }
        if (typeof msg.content !== 'string') {
          return validationError({ messages: `Invalid content for message at index ${i}` });
        }
      }
    }

    // Create conversation
    const conversationData: NewAIConversation = {
      householdId: session.user.householdId,
      userId: session.user.id,
      title: body.title?.trim() || 'New Conversation',
      messages: body.messages || [],
    };

    const [newConversation] = await db.insert(aiConversations).values(conversationData).returning();

    return created(newConversation);
  } catch (err) {
    console.error('Error creating conversation:', err);
    return error('Failed to create conversation', 500);
  }
};
