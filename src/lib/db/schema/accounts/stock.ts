import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Stock - Extended details for stock/ETF holdings.
 *
 * Each stock record represents a position in a single security.
 * The parent Account holds the total value, while this table
 * tracks the specific holding details.
 */
export const stocks = sqliteTable('stocks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Security identification
  symbol: text('symbol').notNull(), // e.g., "AAPL", "VTI"
  exchange: text('exchange'), // e.g., "NASDAQ", "NYSE", "ASX"
  securityName: text('security_name'), // Full name, e.g., "Apple Inc."

  // Holdings
  shares: real('shares').notNull().default(0),
  avgCostBasis: real('avg_cost_basis').notNull().default(0), // Per share
  totalCostBasis: real('total_cost_basis').notNull().default(0), // shares * avgCostBasis

  // Current pricing (updated from API)
  currentPrice: real('current_price').default(0),
  priceUpdatedAt: integer('price_updated_at', { mode: 'timestamp' }),

  // Broker/Account info
  broker: text('broker'), // e.g., "Vanguard", "Fidelity", "CommSec"
  brokerAccountId: text('broker_account_id'), // Account ID at broker

  // Dividend tracking
  dividendYield: real('dividend_yield').default(0), // As decimal
  lastDividendDate: integer('last_dividend_date', { mode: 'timestamp' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;
