import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from './household';
import { users } from './user';

/**
 * Household invite codes for joining existing households.
 * Codes are 8-char alphanumeric (ambiguous chars excluded).
 */
export const householdInvites = sqliteTable('household_invites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  assignedRole: text('assigned_role').notNull().default('member'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // null = never expires
  maxUses: integer('max_uses').notNull().default(1),
  useCount: integer('use_count').notNull().default(0),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokedBy: text('revoked_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type HouseholdInvite = typeof householdInvites.$inferSelect;
export type NewHouseholdInvite = typeof householdInvites.$inferInsert;
