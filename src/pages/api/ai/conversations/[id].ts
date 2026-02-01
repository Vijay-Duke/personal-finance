import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { aiConversations } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../../lib/auth/session';
import { json, error, noContent, notFound, unauthorized, validationError } from '../../../../lib/api/response';

/**
 * GET /api/ai/conversations/:id
 * Get a single conversation with full message history.
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
      .select()
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

    return json(conversation);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    return error('Failed to fetch conversation', 500);
  }
};

/**
 * PUT /api/ai/conversations/:id
 * Update a conversation (title or messages).
 *
 * Request body:
 * - title: string
 * - messages: AIMessage[] (full replacement)
 */
export const PUT: APIRoute = async (context) => {
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

    // Build update data
    const updateData: Partial<typeof aiConversations.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return validationError({ title: 'Title cannot be empty' });
      }
      updateData.title = body.title.trim();
    }

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

      updateData.messages = body.messages;
    }

    const [updated] = await db
      .update(aiConversations)
      .set(updateData)
      .where(eq(aiConversations.id, id))
      .returning();

    return json(updated);
  } catch (err) {
    console.error('Error updating conversation:', err);
    return error('Failed to update conversation', 500);
  }
};

/**
 * DELETE /api/ai/conversations/:id
 * Delete a conversation.
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

    // Delete conversation
    await db.delete(aiConversations).where(eq(aiConversations.id, id));

    return noContent();
  } catch (err) {
    console.error('Error deleting conversation:', err);
    return error('Failed to delete conversation', 500);
  }
};
