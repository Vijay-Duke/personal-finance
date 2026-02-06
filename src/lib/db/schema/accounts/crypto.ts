import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Crypto - Extended details for cryptocurrency holdings.
 *
 * Each crypto record represents holdings of a single cryptocurrency.
 * Supports tracking across multiple wallets/exchanges.
 */
export const cryptoAssets = sqliteTable('crypto_assets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Cryptocurrency identification
  symbol: text('symbol').notNull(), // e.g., "BTC", "ETH"
  name: text('name'), // e.g., "Bitcoin", "Ethereum"
  coingeckoId: text('coingecko_id'), // For API lookups
  logo: text('logo'), // Coin image URL

  // Network/Chain
  network: text('network'), // e.g., "mainnet", "polygon", "arbitrum"

  // Holdings
  holdings: real('holdings').notNull().default(0), // Amount of crypto
  avgCostBasis: real('avg_cost_basis').notNull().default(0), // Per unit in USD
  totalCostBasis: real('total_cost_basis').notNull().default(0),

  // Current pricing (updated from API)
  currentPrice: real('current_price').default(0),
  priceUpdatedAt: integer('price_updated_at', { mode: 'timestamp' }),

  // Storage info
  storageType: text('storage_type'), // "exchange", "hot_wallet", "cold_wallet", "hardware"
  exchangeName: text('exchange_name'), // e.g., "Coinbase", "Binance"
  walletAddress: text('wallet_address'), // Public address (for reference only)
  walletName: text('wallet_name'), // User-friendly name

  // Staking
  isStaked: integer('is_staked', { mode: 'boolean' }).default(false),
  stakingApy: real('staking_apy').default(0),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type CryptoAsset = typeof cryptoAssets.$inferSelect;
export type NewCryptoAsset = typeof cryptoAssets.$inferInsert;
