import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * ExchangeRate - Historical exchange rates for multi-currency support.
 * Rates are stored from -> to with the rate being how many "to" units per 1 "from" unit.
 * Example: USD -> EUR rate of 0.85 means 1 USD = 0.85 EUR
 */
export const exchangeRates = sqliteTable('exchange_rates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Currency pair
  fromCurrency: text('from_currency').notNull(), // ISO 4217 code (e.g., 'USD')
  toCurrency: text('to_currency').notNull(),     // ISO 4217 code (e.g., 'EUR')
  
  // Rate: 1 fromCurrency = rate toCurrency
  rate: real('rate').notNull(),
  
  // Date of the rate (for historical rates)
  date: integer('date', { mode: 'timestamp' }).notNull(),
  
  // Source of the rate
  source: text('source').notNull().default('frankfurter'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;
