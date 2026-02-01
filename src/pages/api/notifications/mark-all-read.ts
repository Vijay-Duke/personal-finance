import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { notifications } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized } from '../../../lib/api/response';

/**
 * POST /api/notifications/mark-all-read
 * Mark all unread notifications as read for the current user.
 *
 * Query params:
 * - type: Optional filter by notification type
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id) {
    return unauthorized('Please log in');
  }

  const url = new URL(context.request.url);
  const typeFilter = url.searchParams.get('type');

  try {
    const conditions = [
      eq(notifications.userId, session.user.id),
      eq(notifications.isRead, false),
    ];

    // Optional filter by type
    if (typeFilter) {
      conditions.push(eq(notifications.type, typeFilter as typeof notifications.$inferSelect.type));
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(...conditions));

    return json({
      success: true,
      message: 'All notifications marked as read',
      typeFilter: typeFilter || null,
    });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    return error('Failed to mark notifications as read', 500);
  }
};

/**
 * GET /api/notifications/mark-all-read
 * Get count of unread notifications (useful for UI badge).
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id) {
    return unauthorized('Please log in');
  }

  try {
    const unreadNotifications = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        priority: notifications.priority,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.isRead, false)
        )
      );

    // Group by priority for the UI
    const byPriority = {
      urgent: unreadNotifications.filter(n => n.priority === 'urgent').length,
      high: unreadNotifications.filter(n => n.priority === 'high').length,
      normal: unreadNotifications.filter(n => n.priority === 'normal').length,
      low: unreadNotifications.filter(n => n.priority === 'low').length,
    };

    return json({
      total: unreadNotifications.length,
      byPriority,
      notifications: unreadNotifications.slice(0, 10), // Return first 10 for preview
    });
  } catch (err) {
    console.error('Error counting notifications:', err);
    return error('Failed to count notifications', 500);
  }
};
