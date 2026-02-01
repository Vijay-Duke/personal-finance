import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Household - The top-level organizational unit for multi-user personal finance.
 * All financial data (accounts, transactions, budgets) belongs to a household.
 * Multiple users can belong to a household with different roles.
 */
export const households = sqliteTable('households', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  primaryCurrency: text('primary_currency').notNull().default('USD'),
  financialYearStart: integer('financial_year_start').notNull().default(1), // 1 = January
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;
