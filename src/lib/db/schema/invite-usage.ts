import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { householdInvites } from './household-invite';
import { users } from './user';

/**
 * Audit trail for invite code usage.
 * Records each time an invite code is redeemed.
 */
export const inviteUsages = sqliteTable('invite_usages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  inviteId: text('invite_id')
    .notNull()
    .references(() => householdInvites.id, { onDelete: 'cascade' }),
  usedBy: text('used_by')
    .notNull()
    .references(() => users.id),
  usedAt: integer('used_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type InviteUsage = typeof inviteUsages.$inferSelect;
export type NewInviteUsage = typeof inviteUsages.$inferInsert;
