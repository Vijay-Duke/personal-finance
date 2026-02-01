import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { notifications, notificationTypes, notificationPriorities } from '../../../lib/db/schema';
import { eq, and, desc, isNull, gt } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/notifications
 * List notifications for the current user.
 *
 * Query params:
 * - unreadOnly: If true, returns only unread notifications
 * - type: Filter by notification type
 * - limit: Maximum number of results (default: 50, max: 100)
 * - includeExpired: If true, includes expired notifications
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id) {
    return unauthorized('Please log in');
  }

  const url = new URL(context.request.url);
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
  const typeFilter = url.searchParams.get('type');
  const includeExpired = url.searchParams.get('includeExpired') === 'true';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  try {
    const conditions = [eq(notifications.userId, session.user.id)];

    // Filter by read status
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    // Filter by type
    if (typeFilter && notificationTypes.includes(typeFilter as typeof notificationTypes[number])) {
      conditions.push(eq(notifications.type, typeFilter as typeof notificationTypes[number]));
    }

    // Exclude expired notifications unless explicitly included
    if (!includeExpired) {
      conditions.push(
        isNull(notifications.expiresAt),
        gt(notifications.expiresAt, new Date())
      );
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return json(results);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return error('Failed to fetch notifications', 500);
  }
};

/**
 * POST /api/notifications
 * Create a new notification (primarily for system use).
 * In production, this would typically be called by internal services,
 * not directly by clients.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.id) {
    return unauthorized('Please log in');
  }

  try {
    const body = await context.request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return error('Notification title is required');
    }
    if (!body.message?.trim()) {
      return error('Notification message is required');
    }

    // Validate type if provided
    if (body.type && !notificationTypes.includes(body.type)) {
      return error(`Invalid notification type. Must be one of: ${notificationTypes.join(', ')}`);
    }

    // Validate priority if provided
    if (body.priority && !notificationPriorities.includes(body.priority)) {
      return error(`Invalid priority. Must be one of: ${notificationPriorities.join(', ')}`);
    }

    const notificationData = {
      userId: session.user.id,
      title: body.title.trim(),
      message: body.message.trim(),
      type: body.type || 'system',
      priority: body.priority || 'normal',
      link: body.link,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      metadata: body.metadata ? JSON.stringify(body.metadata) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      isRead: false,
    };

    const [newNotification] = await db.insert(notifications).values(notificationData).returning();

    return created(newNotification);
  } catch (err) {
    console.error('Error creating notification:', err);
    return error('Failed to create notification', 500);
  }
};
