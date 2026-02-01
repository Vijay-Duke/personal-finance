import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from './household';
import { categories } from './category';
import { accounts } from './accounts';

/**
 * Budget periods
 */
export const budgetPeriods = ['monthly', 'quarterly', 'yearly'] as const;
export type BudgetPeriod = (typeof budgetPeriods)[number];

/**
 * Budget - Monthly/periodic spending limits by category
 */
export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Budget target
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),

  // Budget amount
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),

  // Period settings
  period: text('period', { enum: budgetPeriods }).notNull().default('monthly'),

  // For tracking specific months (YYYY-MM format) or leave null for recurring
  periodStart: text('period_start'), // e.g., '2024-01' for January 2024

  // Rollover settings
  rolloverEnabled: integer('rollover_enabled', { mode: 'boolean' }).notNull().default(false),
  rolloverAmount: real('rollover_amount').default(0), // Amount rolled over from previous period

  // Alert settings
  alertThreshold: real('alert_threshold').default(80), // Alert at 80% by default
  alertEnabled: integer('alert_enabled', { mode: 'boolean' }).notNull().default(true),

  // Notes
  notes: text('notes'),

  // Is budget active?
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

/**
 * Goal status
 */
export const goalStatuses = ['active', 'paused', 'completed', 'cancelled'] as const;
export type GoalStatus = (typeof goalStatuses)[number];

/**
 * Goal types
 */
export const goalTypes = [
  'savings', // Save up to X amount
  'debt_payoff', // Pay off a debt
  'emergency_fund', // Build emergency fund
  'investment', // Investment target
  'purchase', // Save for a purchase
  'retirement', // Retirement target
  'custom', // Custom goal
] as const;
export type GoalType = (typeof goalTypes)[number];

/**
 * Goal - Savings and financial targets
 */
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Goal details
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: goalTypes }).notNull().default('savings'),
  status: text('status', { enum: goalStatuses }).notNull().default('active'),

  // Target
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),

  // Timeline
  startDate: integer('start_date', { mode: 'timestamp' }),
  targetDate: integer('target_date', { mode: 'timestamp' }),
  completedDate: integer('completed_date', { mode: 'timestamp' }),

  // Linked accounts (JSON array of account IDs that contribute to this goal)
  linkedAccountIds: text('linked_account_ids'), // JSON array

  // Monthly contribution target
  monthlyContribution: real('monthly_contribution'),

  // Priority (1 = highest)
  priority: integer('priority').notNull().default(5),

  // Icon and color for display
  icon: text('icon'),
  color: text('color'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

/**
 * Goal contributions - Track contributions to goals
 */
export const goalContributions = sqliteTable('goal_contributions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  goalId: text('goal_id')
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),

  // Contribution details
  amount: real('amount').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),

  // Source (optional - could be from a specific account or transaction)
  accountId: text('account_id')
    .references(() => accounts.id, { onDelete: 'set null' }),
  transactionId: text('transaction_id'),

  // Notes
  notes: text('notes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type GoalContribution = typeof goalContributions.$inferSelect;
export type NewGoalContribution = typeof goalContributions.$inferInsert;

/**
 * Insurance policy types
 */
export const insuranceTypes = [
  'life',
  'health',
  'home',
  'auto',
  'renters',
  'umbrella',
  'disability',
  'pet',
  'travel',
  'business',
  'other',
] as const;
export type InsuranceType = (typeof insuranceTypes)[number];

/**
 * Insurance policy status
 */
export const insuranceStatuses = ['active', 'pending', 'lapsed', 'cancelled', 'expired'] as const;
export type InsuranceStatus = (typeof insuranceStatuses)[number];

/**
 * Premium frequencies
 */
export const premiumFrequencies = ['monthly', 'quarterly', 'semi_annual', 'annual'] as const;
export type PremiumFrequency = (typeof premiumFrequencies)[number];

/**
 * Insurance policies
 */
export const insurancePolicies = sqliteTable('insurance_policies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Policy details
  name: text('name').notNull(),
  type: text('type', { enum: insuranceTypes }).notNull(),
  status: text('status', { enum: insuranceStatuses }).notNull().default('active'),
  policyNumber: text('policy_number'),
  provider: text('provider').notNull(),

  // Coverage
  coverageAmount: real('coverage_amount'),
  deductible: real('deductible'),
  currency: text('currency').notNull().default('USD'),

  // Premium
  premiumAmount: real('premium_amount').notNull(),
  premiumFrequency: text('premium_frequency', { enum: premiumFrequencies }).notNull().default('monthly'),
  nextPremiumDate: integer('next_premium_date', { mode: 'timestamp' }),

  // Dates
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  renewalDate: integer('renewal_date', { mode: 'timestamp' }),

  // Linked assets (JSON array - policies can cover multiple assets)
  linkedAssetIds: text('linked_asset_ids'), // JSON array

  // Beneficiaries (JSON array)
  beneficiaries: text('beneficiaries'), // JSON array

  // Contact info
  agentName: text('agent_name'),
  agentPhone: text('agent_phone'),
  agentEmail: text('agent_email'),

  // Notes and documents
  notes: text('notes'),
  documentUrl: text('document_url'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type NewInsurancePolicy = typeof insurancePolicies.$inferInsert;

/**
 * Financial projections - For runway and retirement calculations
 */
export const financialProjections = sqliteTable('financial_projections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Projection details
  name: text('name').notNull(),
  description: text('description'),

  // Input parameters (JSON)
  parameters: text('parameters').notNull(), // JSON object with projection inputs

  // Results (JSON)
  results: text('results'), // JSON object with calculated results

  // Projection date
  projectionDate: integer('projection_date', { mode: 'timestamp' }).notNull(),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type FinancialProjection = typeof financialProjections.$inferSelect;
export type NewFinancialProjection = typeof financialProjections.$inferInsert;
