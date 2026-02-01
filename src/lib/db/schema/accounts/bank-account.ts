import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { accounts } from './account';

/**
 * Bank account types.
 */
export const bankAccountTypes = [
  'checking',
  'savings',
  'money_market',
  'cd',
  'other',
] as const;

export type BankAccountType = typeof bankAccountTypes[number];

/**
 * BankAccount - Extended details for bank accounts.
 *
 * Links to the base Account table. Contains bank-specific fields
 * like institution name, account number, and account type.
 */
export const bankAccounts = sqliteTable('bank_accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Bank details
  bankName: text('bank_name'),
  accountNumber: text('account_number'), // Last 4 digits or masked
  routingNumber: text('routing_number'), // Last 4 digits or masked
  accountType: text('account_type', { enum: bankAccountTypes }).notNull().default('checking'),

  // Interest
  interestRate: real('interest_rate').default(0), // APY as decimal (0.045 = 4.5%)

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
