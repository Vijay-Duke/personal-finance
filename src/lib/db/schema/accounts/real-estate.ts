import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Property types for real estate
 */
export const propertyTypes = [
  'primary_residence',
  'investment',
  'vacation',
  'commercial',
  'land',
  'other',
] as const;

export type PropertyType = typeof propertyTypes[number];

/**
 * Real Estate details table
 * Extends the base accounts table with property-specific information.
 */
export const realEstateProperties = sqliteTable('real_estate_properties', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Property identification
  propertyType: text('property_type', { enum: propertyTypes }).notNull().default('primary_residence'),

  // Address
  address: text('address'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country').default('US'),

  // Property details
  squareFootage: integer('square_footage'),
  bedrooms: integer('bedrooms'),
  bathrooms: real('bathrooms'), // 2.5 baths, etc.
  yearBuilt: integer('year_built'),
  lotSize: real('lot_size'), // in acres

  // Valuation
  purchasePrice: real('purchase_price'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  currentEstimatedValue: real('current_estimated_value'),
  lastAppraisalDate: integer('last_appraisal_date', { mode: 'timestamp' }),
  lastAppraisalValue: real('last_appraisal_value'),

  // Rental information (for investment properties)
  isRental: integer('is_rental', { mode: 'boolean' }).notNull().default(false),
  monthlyRentIncome: real('monthly_rent_income'),
  occupancyRate: real('occupancy_rate'), // 0.0 to 1.0

  // Expenses
  annualPropertyTax: real('annual_property_tax'),
  annualInsurance: real('annual_insurance'),
  monthlyHOA: real('monthly_hoa'),
  annualMaintenance: real('annual_maintenance'),

  // Linked mortgage (references a debt account)
  linkedMortgageId: text('linked_mortgage_id'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type RealEstateProperty = typeof realEstateProperties.$inferSelect;
export type NewRealEstateProperty = typeof realEstateProperties.$inferInsert;
