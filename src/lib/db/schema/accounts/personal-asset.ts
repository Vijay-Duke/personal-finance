import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Personal asset categories
 */
export const personalAssetTypes = [
  'vehicle',
  'jewelry',
  'art',
  'collectibles',
  'electronics',
  'furniture',
  'equipment',
  'other',
] as const;

export type PersonalAssetType = typeof personalAssetTypes[number];

/**
 * Vehicle types (when asset type is 'vehicle')
 */
export const vehicleTypes = [
  'car',
  'motorcycle',
  'boat',
  'rv',
  'aircraft',
  'other',
] as const;

export type VehicleType = typeof vehicleTypes[number];

/**
 * Condition ratings
 */
export const conditionRatings = [
  'excellent',
  'good',
  'fair',
  'poor',
] as const;

export type ConditionRating = typeof conditionRatings[number];

/**
 * Personal Assets table
 * Extends the base accounts table for vehicles, collectibles, and valuables.
 */
export const personalAssets = sqliteTable('personal_assets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Asset classification
  assetType: text('asset_type', { enum: personalAssetTypes }).notNull(),

  // General details
  make: text('make'),
  model: text('model'),
  year: integer('year'),
  serialNumber: text('serial_number'),
  condition: text('condition', { enum: conditionRatings }),
  description: text('description'),

  // Valuation
  purchasePrice: real('purchase_price'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  currentEstimatedValue: real('current_estimated_value'),
  lastAppraisalDate: integer('last_appraisal_date', { mode: 'timestamp' }),
  lastAppraisalValue: real('last_appraisal_value'),
  depreciationRate: real('depreciation_rate'), // Annual depreciation as decimal

  // Vehicle-specific
  vehicleType: text('vehicle_type', { enum: vehicleTypes }),
  vin: text('vin'), // Vehicle Identification Number
  licensePlate: text('license_plate'),
  mileage: integer('mileage'),
  fuelType: text('fuel_type'),

  // Insurance
  isInsured: integer('is_insured', { mode: 'boolean' }).default(false),
  insuranceProvider: text('insurance_provider'),
  insurancePolicyNumber: text('insurance_policy_number'),
  insurancePremium: real('insurance_premium'), // Annual
  insuranceCoverage: real('insurance_coverage'),

  // Linked loan (references a debt account for financed assets)
  linkedLoanId: text('linked_loan_id'),

  // Location/Storage
  location: text('location'),
  storageNotes: text('storage_notes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type PersonalAsset = typeof personalAssets.$inferSelect;
export type NewPersonalAsset = typeof personalAssets.$inferInsert;
