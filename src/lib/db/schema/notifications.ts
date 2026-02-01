import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './user';

/**
 * Notification types for different events.
 */
export const notificationTypes = [
  'transaction_alert',
  'budget_warning',
  'goal_milestone',
  'sync_complete',
  'sync_failed',
  'price_alert',
  'system',
] as const;
export type NotificationType = typeof notificationTypes[number];

/**
 * Notification priority levels.
 */
export const notificationPriorities = ['low', 'normal', 'high', 'urgent'] as const;
export type NotificationPriority = typeof notificationPriorities[number];

/**
 * Notifications table - User notifications for various events.
 */
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // User relationship
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Notification content
  title: text('title').notNull(),
  message: text('message').notNull(),

  // Classification
  type: text('type', { enum: notificationTypes }).notNull().default('system'),
  priority: text('priority', { enum: notificationPriorities }).notNull().default('normal'),

  // Status
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),

  // Optional link to related resource
  link: text('link'), // URL path to navigate to when clicked
  resourceType: text('resource_type'), // e.g., 'transaction', 'account', 'goal'
  resourceId: text('resource_id'), // ID of the related resource

  // Metadata for extensibility
  metadata: text('metadata'), // JSON string for additional data

  // Expiration (optional)
  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Type exports
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

/**
 * Default notification preferences for new users.
 */
export const defaultNotificationPreferences = {
  transaction_alert: { email: true, push: true, inApp: true },
  budget_warning: { email: true, push: true, inApp: true },
  goal_milestone: { email: true, push: false, inApp: true },
  sync_complete: { email: false, push: false, inApp: true },
  sync_failed: { email: true, push: true, inApp: true },
  price_alert: { email: false, push: true, inApp: true },
  system: { email: true, push: false, inApp: true },
} as const;
