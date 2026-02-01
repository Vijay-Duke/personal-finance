import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from '../household';

/**
 * Account types supported by the system.
 * Each type has a corresponding detail table with type-specific fields.
 */
export const accountTypes = [
  'bank_account',
  'stock',
  'crypto',
  'real_estate',
  'debt',
  'superannuation',
  'personal_asset',
  'business_asset',
] as const;

export type AccountType = typeof accountTypes[number];

/**
 * Base Account table - polymorphic design for all asset types.
 *
 * This is the parent table for all financial assets. Each account has:
 * - A unique ID and household ownership
 * - A type that determines which detail table to join
 * - Common fields like name, currency, and balance tracking
 *
 * Type-specific details are stored in separate tables (bank_accounts, stocks, etc.)
 * that reference this table via accountId.
 */
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Account identification
  name: text('name').notNull(),
  type: text('type', { enum: accountTypes }).notNull(),

  // Financial details
  currency: text('currency').notNull().default('USD'),
  currentBalance: real('current_balance').notNull().default(0),

  // Classification
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isLiquid: integer('is_liquid', { mode: 'boolean' }).notNull().default(true),
  includeInNetWorth: integer('include_in_net_worth', { mode: 'boolean' }).notNull().default(true),

  // For projections
  expectedAnnualReturnRate: real('expected_annual_return_rate').default(0),

  // Display
  icon: text('icon'), // Lucide icon name
  color: text('color'), // Hex color
  sortOrder: integer('sort_order').notNull().default(0),

  // Notes
  notes: text('notes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
