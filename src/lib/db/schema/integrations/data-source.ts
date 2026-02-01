import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from '../household';

/**
 * Data source types for external API integrations.
 */
export const dataSourceTypes = ['stock', 'crypto', 'forex', 'property', 'metal'] as const;
export type DataSourceType = typeof dataSourceTypes[number];

/**
 * Data source providers.
 */
export const dataSourceProviders = [
  'yahoo_finance',    // Stocks/ETFs
  'alpha_vantage',    // Stocks (alternative)
  'coingecko',        // Crypto
  'frankfurter',      // Exchange rates
  'open_exchange',    // Exchange rates (alternative)
  'metals_dev',       // Precious metals
  'zillow',           // Property (US)
  'domain',           // Property (AU)
  'manual',           // Manual entry
] as const;
export type DataSourceProvider = typeof dataSourceProviders[number];

/**
 * Sync frequency options.
 */
export const syncFrequencies = ['realtime', 'hourly', 'daily'] as const;
export type SyncFrequency = typeof syncFrequencies[number];

/**
 * DataSource - Configuration for external API integrations.
 * Stores API keys and sync settings for fetching live prices.
 */
export const dataSources = sqliteTable('data_sources', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  
  // Data type and provider
  type: text('type', { enum: dataSourceTypes }).notNull(),
  provider: text('provider', { enum: dataSourceProviders }).notNull(),
  
  // API configuration (optional for providers that don't require keys)
  apiKey: text('api_key'), // Encrypted API key (if required)
  
  // Sync settings
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  syncFrequency: text('sync_frequency', { enum: syncFrequencies }).notNull().default('daily'),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  
  // Rate limiting tracking
  rateLimitRemaining: integer('rate_limit_remaining'),
  rateLimitResetAt: integer('rate_limit_reset_at', { mode: 'timestamp' }),
  
  // Error tracking
  lastErrorAt: integer('last_error_at', { mode: 'timestamp' }),
  lastErrorMessage: text('last_error_message'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
