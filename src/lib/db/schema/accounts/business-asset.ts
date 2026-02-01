import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Business asset categories
 */
export const businessAssetTypes = [
  'business_ownership',
  'partnership',
  'llc_membership',
  'equipment',
  'inventory',
  'intellectual_property',
  'accounts_receivable',
  'other',
] as const;

export type BusinessAssetType = typeof businessAssetTypes[number];

/**
 * Business entity types
 */
export const entityTypes = [
  'sole_proprietorship',
  'partnership',
  'llc',
  'corporation',
  's_corporation',
  'trust',
  'other',
] as const;

export type EntityType = typeof entityTypes[number];

/**
 * Business Assets table
 * Extends the base accounts table for business ownership and equity.
 */
export const businessAssets = sqliteTable('business_assets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Asset classification
  assetType: text('asset_type', { enum: businessAssetTypes }).notNull(),

  // Business details
  businessName: text('business_name'),
  entityType: text('entity_type', { enum: entityTypes }),
  ein: text('ein'), // Employer Identification Number (stored securely, last 4 only)
  stateOfFormation: text('state_of_formation'),
  dateFormed: integer('date_formed', { mode: 'timestamp' }),
  industry: text('industry'),

  // Ownership
  ownershipPercentage: real('ownership_percentage'), // as decimal (0.25 = 25%)
  shareCount: integer('share_count'),
  totalShares: integer('total_shares'),
  shareClass: text('share_class'), // e.g., "Common", "Preferred"
  vestingSchedule: text('vesting_schedule'),
  fullyVestedDate: integer('fully_vested_date', { mode: 'timestamp' }),

  // Valuation
  purchasePrice: real('purchase_price'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  currentEstimatedValue: real('current_estimated_value'),
  lastValuationDate: integer('last_valuation_date', { mode: 'timestamp' }),
  valuationMethod: text('valuation_method'), // e.g., "409A", "Book Value", "Market Comp"

  // Financial performance (annual)
  annualRevenue: real('annual_revenue'),
  annualProfit: real('annual_profit'),
  lastDistributionDate: integer('last_distribution_date', { mode: 'timestamp' }),
  lastDistributionAmount: real('last_distribution_amount'),
  annualDistributions: real('annual_distributions'),

  // Equipment/IP specific
  assetDescription: text('asset_description'),
  serialNumber: text('serial_number'),
  usefulLifeYears: integer('useful_life_years'),
  salvageValue: real('salvage_value'),
  depreciationMethod: text('depreciation_method'), // e.g., "Straight-line", "MACRS"

  // Key contacts
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type BusinessAsset = typeof businessAssets.$inferSelect;
export type NewBusinessAsset = typeof businessAssets.$inferInsert;
