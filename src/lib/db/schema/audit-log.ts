import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from './household';
import { users } from './user';

/**
 * Audit action types for household-level activity tracking.
 */
export const auditActions = [
  'member_joined',
  'member_left',
  'member_removed',
  'role_changed',
  'invite_created',
  'invite_revoked',
  'household_updated',
  'ownership_transferred',
] as const;
export type AuditAction = typeof auditActions[number];

/**
 * Target entity types for audit log entries.
 */
export const auditTargetTypes = ['member', 'invite', 'household'] as const;
export type AuditTargetType = typeof auditTargetTypes[number];

/**
 * Audit log table - Tracks household-level actions for accountability.
 */
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  details: text('details'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
