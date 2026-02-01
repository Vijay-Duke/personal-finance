import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { notifications, notificationTypes, notificationPriorities } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, noContent, notFound, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/notifications/:id
 * Get a single notification by ID.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id) {
    return unauthorized('Please log in');
  }

  const { id } = context.params;
  if (!id) {
    return error('Notification ID is required');
  }

  try {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, session.user.id)
        )
      );

    if (!notification) {
      return notFound('Notification not found');
    }

    return json(notification);
  } catch (err) {
    console.error('Error fetching notification:', err);
    return error('Failed to fetch notification', 500);
  }
};

/**
 * PATCH /api/notifications/:id
 * Update a notification (primarily to mark as read/unread).
 */
export const PATCH: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id) {
    return unauthorized('Please log in');
  }

  const { id } = context.params;
  if (!id) {
    return error('Notification ID is required');
  }

  try {
    // Verify notification exists and belongs to user
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, session.user.id)
        )
      );

    if (!existing) {
      return notFound('Notification not found');
    }

    const body = await context.request.json();
    const updateData: Partial<typeof notifications.$inferInsert> = {};

    // Update read status
    if (body.isRead !== undefined) {
      updateData.isRead = body.isRead;
      updateData.readAt = body.isRead ? new Date() : null;
    }

    // Update type if valid
    if (body.type && notificationTypes.includes(body.type)) {
      updateData.type = body.type;
    }

    // Update priority if valid
    if (body.priority && notificationPriorities.includes(body.priority)) {
      updateData.priority = body.priority;
    }

    // Update metadata
    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata ? JSON.stringify(body.metadata) : null;
    }

    const [updated] = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, id))
      .returning();

    return json(updated);
  } catch (err) {
    console.error('Error updating notification:', err);
    return error('Failed to update notification', 500);
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification.
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id) {
    return unauthorized('Please log in');
  }

  const { id } = context.params;
  if (!id) {
    return error('Notification ID is required');
  }

  try {
    // Verify notification exists and belongs to user
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, session.user.id)
        )
      );

    if (!existing) {
      return notFound('Notification not found');
    }

    await db.delete(notifications).where(eq(notifications.id, id));

    return noContent();
  } catch (err) {
    console.error('Error deleting notification:', err);
    return error('Failed to delete notification', 500);
  }
};
