import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Superannuation/Retirement account types
 * Includes Australian super and international equivalents
 */
export const superannuationTypes = [
  // Australian
  'super_accumulation',
  'super_pension',
  'smsf', // Self-managed super fund

  // US
  '401k',
  '403b',
  'ira_traditional',
  'ira_roth',
  'sep_ira',
  'simple_ira',

  // UK
  'pension_workplace',
  'pension_personal',
  'sipp', // Self-invested personal pension

  // Other
  'other_retirement',
] as const;

export type SuperannuationType = typeof superannuationTypes[number];

/**
 * Contribution frequency options
 */
export const contributionFrequencies = [
  'per_paycheck',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'annually',
] as const;

export type ContributionFrequency = typeof contributionFrequencies[number];

/**
 * Superannuation/Retirement accounts table
 * Extends the base accounts table with retirement-specific information.
 */
export const superannuationAccounts = sqliteTable('superannuation_accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Account classification
  superType: text('super_type', { enum: superannuationTypes }).notNull(),

  // Provider information
  fundName: text('fund_name'),
  fundABN: text('fund_abn'), // Australian Business Number
  memberNumber: text('member_number'),

  // Beneficiary
  beneficiaryName: text('beneficiary_name'),
  beneficiaryRelationship: text('beneficiary_relationship'),

  // Contributions
  employerContributionRate: real('employer_contribution_rate'), // as decimal (0.095 = 9.5%)
  employeeContributionRate: real('employee_contribution_rate'),
  salaryPercentage: real('salary_percentage'), // Total contribution as % of salary
  contributionFrequency: text('contribution_frequency', { enum: contributionFrequencies }),
  lastContributionDate: integer('last_contribution_date', { mode: 'timestamp' }),
  lastContributionAmount: real('last_contribution_amount'),

  // Tax treatment
  taxFreeComponent: real('tax_free_component'),
  taxableComponent: real('taxable_component'),
  preTaxBalance: real('pre_tax_balance'), // For US 401k/IRA
  postTaxBalance: real('post_tax_balance'), // Roth components

  // Investment
  investmentOption: text('investment_option'), // e.g., "Growth", "Balanced", "Conservative"
  historicalReturn: real('historical_return'), // Annual return rate

  // Insurance within super
  hasLifeInsurance: integer('has_life_insurance', { mode: 'boolean' }).default(false),
  lifeInsuranceCover: real('life_insurance_cover'),
  hasTpdInsurance: integer('has_tpd_insurance', { mode: 'boolean' }).default(false), // Total & Permanent Disability
  tpdInsuranceCover: real('tpd_insurance_cover'),
  hasIncomeProtection: integer('has_income_protection', { mode: 'boolean' }).default(false),
  incomeProtectionCover: real('income_protection_cover'),

  // Preservation
  preservationAge: integer('preservation_age'),
  accessDate: integer('access_date', { mode: 'timestamp' }), // When funds become accessible

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type SuperannuationAccount = typeof superannuationAccounts.$inferSelect;
export type NewSuperannuationAccount = typeof superannuationAccounts.$inferInsert;
