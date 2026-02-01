import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Sources of valuation data.
 */
export const valuationSources = [
  'manual',      // User-entered value
  'api',         // From external API (Yahoo Finance, CoinGecko, etc.)
  'import',      // From CSV/statement import
  'calculated',  // Calculated from transactions
] as const;

export type ValuationSource = typeof valuationSources[number];

/**
 * ValuationHistory - Historical record of account values.
 *
 * Used to track account value changes over time for charting
 * and trend analysis. Values are recorded:
 * - Daily via scheduled job
 * - On significant changes
 * - When user manually updates
 */
export const valuationHistory = sqliteTable('valuation_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // The valuation
  date: text('date').notNull(), // YYYY-MM-DD format
  value: real('value').notNull(),
  currency: text('currency').notNull().default('USD'),

  // Source tracking
  source: text('source', { enum: valuationSources }).notNull().default('manual'),

  // For stocks/crypto, track underlying price
  underlyingPrice: real('underlying_price'),
  quantity: real('quantity'), // Shares or holdings at this point

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  // Index for efficient date-based queries
  accountDateIdx: index('valuation_account_date_idx').on(table.accountId, table.date),
  dateIdx: index('valuation_date_idx').on(table.date),
}));

export type ValuationHistory = typeof valuationHistory.$inferSelect;
export type NewValuationHistory = typeof valuationHistory.$inferInsert;
