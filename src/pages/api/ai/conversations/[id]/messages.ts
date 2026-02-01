import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/db';
import { aiConversations, type AIMessage } from '../../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../../../lib/auth/session';
import { json, error, created, notFound, unauthorized, validationError } from '../../../../../lib/api/response';

/**
 * GET /api/ai/conversations/:id/messages
 * Get messages for a specific conversation.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Conversation ID is required');
  }

  try {
    const [conversation] = await db
      .select({ messages: aiConversations.messages })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.id, id),
          eq(aiConversations.householdId, session.user.householdId),
          eq(aiConversations.userId, session.user.id)
        )
      );

    if (!conversation) {
      return notFound('Conversation not found');
    }

    return json(conversation.messages || []);
  } catch (err) {
    console.error('Error fetching messages:', err);
    return error('Failed to fetch messages', 500);
  }
};

/**
 * POST /api/ai/conversations/:id/messages
 * Add a message to an existing conversation.
 *
 * Request body:
 * - role: 'user' | 'assistant' | 'system' (required)
 * - content: string (required)
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Conversation ID is required');
  }

  try {
    // Verify conversation exists and belongs to user
    const [existing] = await db
      .select()
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.id, id),
          eq(aiConversations.householdId, session.user.householdId),
          eq(aiConversations.userId, session.user.id)
        )
      );

    if (!existing) {
      return notFound('Conversation not found');
    }

    const body = await context.request.json();

    // Validate required fields
    if (!body.role || !['user', 'assistant', 'system'].includes(body.role)) {
      return validationError({ role: 'Role must be user, assistant, or system' });
    }

    if (typeof body.content !== 'string' || body.content.trim() === '') {
      return validationError({ content: 'Content is required' });
    }

    // Create new message
    const newMessage: AIMessage = {
      role: body.role,
      content: body.content.trim(),
      timestamp: new Date().toISOString(),
    };

    // Get current messages and append
    const currentMessages = (existing.messages as AIMessage[]) || [];
    const updatedMessages = [...currentMessages, newMessage];

    // Update conversation with new message
    const [updated] = await db
      .update(aiConversations)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, id))
      .returning();

    return created(newMessage);
  } catch (err) {
    console.error('Error adding message:', err);
    return error('Failed to add message', 500);
  }
};

/**
 * DELETE /api/ai/conversations/:id/messages
 * Clear all messages from a conversation (keeps the conversation).
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id || !session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Conversation ID is required');
  }

  try {
    // Verify conversation exists and belongs to user
    const [existing] = await db
      .select()
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.id, id),
          eq(aiConversations.householdId, session.user.householdId),
          eq(aiConversations.userId, session.user.id)
        )
      );

    if (!existing) {
      return notFound('Conversation not found');
    }

    // Clear messages
    const [updated] = await db
      .update(aiConversations)
      .set({
        messages: [],
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, id))
      .returning();

    return json({ success: true, messageCount: 0 });
  } catch (err) {
    console.error('Error clearing messages:', err);
    return error('Failed to clear messages', 500);
  }
};
