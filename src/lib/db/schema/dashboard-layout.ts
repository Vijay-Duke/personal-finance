import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './user';
import { households } from './household';

export const dashboardLayouts = sqliteTable(
  'dashboard_layouts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    layout: text('layout').notNull(), // JSON string
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    userUnique: uniqueIndex('dashboard_layouts_user_unique').on(table.userId),
  })
);

export type DashboardLayout = typeof dashboardLayouts.$inferSelect;
export type NewDashboardLayout = typeof dashboardLayouts.$inferInsert;
