import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Debt types supported by the system
 */
export const debtTypes = [
  'mortgage',
  'credit_card',
  'personal_loan',
  'student_loan',
  'car_loan',
  'heloc',
  'medical_debt',
  'other',
] as const;

export type DebtType = typeof debtTypes[number];

/**
 * Payment frequency options
 */
export const paymentFrequencies = [
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'annually',
] as const;

export type PaymentFrequency = typeof paymentFrequencies[number];

/**
 * Debts table
 * Extends the base accounts table with debt-specific information.
 * Note: Debt balances are stored as positive numbers in the accounts table,
 * but represent liabilities (negative net worth contribution).
 */
export const debts = sqliteTable('debts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Debt classification
  debtType: text('debt_type', { enum: debtTypes }).notNull(),

  // Lender information
  lender: text('lender'),
  lenderAccountNumber: text('lender_account_number'), // Last 4 digits only

  // Original loan details
  originalBalance: real('original_balance'),
  originationDate: integer('origination_date', { mode: 'timestamp' }),

  // Interest
  interestRate: real('interest_rate'), // Annual percentage as decimal (0.05 = 5%)
  isFixedRate: integer('is_fixed_rate', { mode: 'boolean' }).notNull().default(true),
  rateAdjustmentDate: integer('rate_adjustment_date', { mode: 'timestamp' }),

  // Payment information
  minimumPayment: real('minimum_payment'),
  paymentFrequency: text('payment_frequency', { enum: paymentFrequencies }).default('monthly'),
  paymentDueDay: integer('payment_due_day'), // Day of month (1-31)
  autopayEnabled: integer('autopay_enabled', { mode: 'boolean' }).default(false),

  // Loan term
  termMonths: integer('term_months'),
  maturityDate: integer('maturity_date', { mode: 'timestamp' }),

  // Credit-specific (for credit cards)
  creditLimit: real('credit_limit'),
  availableCredit: real('available_credit'),

  // Mortgage-specific
  linkedPropertyId: text('linked_property_id'), // References real_estate account
  escrowBalance: real('escrow_balance'),
  includesEscrow: integer('includes_escrow', { mode: 'boolean' }).default(false),
  pmiAmount: real('pmi_amount'), // Private mortgage insurance

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
