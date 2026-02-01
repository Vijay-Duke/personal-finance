import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './user';

/**
 * Risk tolerance levels for investment recommendations.
 */
export const riskToleranceLevels = ['conservative', 'moderate', 'aggressive'] as const;
export type RiskTolerance = typeof riskToleranceLevels[number];

/**
 * Income frequency options.
 */
export const incomeFrequencies = ['weekly', 'fortnightly', 'monthly', 'yearly'] as const;
export type IncomeFrequency = typeof incomeFrequencies[number];

/**
 * UserFinancialProfile - Extended financial settings for retirement planning,
 * runway calculations, and AI-powered financial projections.
 */
export const userFinancialProfiles = sqliteTable('user_financial_profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Demographics for retirement calculations
  dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }),
  targetRetirementAge: integer('target_retirement_age').default(65),
  lifeExpectancy: integer('life_expectancy').default(85),

  // Investment profile
  riskTolerance: text('risk_tolerance', { enum: riskToleranceLevels }).default('moderate'),
  expectedAnnualReturn: real('expected_annual_return').default(0.07), // 7% default

  // Income details
  annualIncome: real('annual_income'),
  incomeFrequency: text('income_frequency', { enum: incomeFrequencies }).default('monthly'),
  taxBracket: real('tax_bracket'), // As decimal, e.g., 0.32 for 32%

  // Expense tracking
  estimatedMonthlyExpense: real('estimated_monthly_expense'),
  essentialMonthlyExpense: real('essential_monthly_expense'), // For runway calculation

  // Superannuation/Retirement specific (Australian context)
  superContributionRate: real('super_contribution_rate').default(0.115), // 11.5% default
  additionalSuperContribution: real('additional_super_contribution').default(0),

  // Country-specific
  country: text('country').default('AU'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type UserFinancialProfile = typeof userFinancialProfiles.$inferSelect;
export type NewUserFinancialProfile = typeof userFinancialProfiles.$inferInsert;
