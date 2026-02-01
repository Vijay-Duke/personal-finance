import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from './household';
import { accounts } from './accounts/account';
import { categories } from './category';
import { users } from './user';

/**
 * Transaction types
 */
export const transactionTypes = ['income', 'expense', 'transfer'] as const;
export type TransactionType = typeof transactionTypes[number];

/**
 * Transaction status
 */
export const transactionStatuses = [
  'pending',    // Scheduled or not yet cleared
  'cleared',    // Confirmed/cleared
  'reconciled', // Verified against bank statement
  'void',       // Cancelled/voided
] as const;
export type TransactionStatus = typeof transactionStatuses[number];

/**
 * Transaction - Core financial transaction record
 */
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Account association
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // For transfers: the destination account
  transferAccountId: text('transfer_account_id')
    .references(() => accounts.id, { onDelete: 'set null' }),

  // Linked transfer transaction (for double-entry)
  linkedTransactionId: text('linked_transaction_id'),

  // Transaction details
  type: text('type', { enum: transactionTypes }).notNull(),
  status: text('status', { enum: transactionStatuses }).notNull().default('cleared'),

  // Amount (always positive, type determines direction)
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),

  // Date and time
  date: integer('date', { mode: 'timestamp' }).notNull(),

  // Description and merchant
  description: text('description'),
  merchant: text('merchant'),
  merchantCategory: text('merchant_category'), // MCC code or merchant-provided category

  // Categorization
  categoryId: text('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),

  // Notes and metadata
  notes: text('notes'),
  reference: text('reference'), // Check number, reference ID, etc.

  // Import tracking
  importBatchId: text('import_batch_id'),
  externalId: text('external_id'), // ID from bank/import source for deduplication

  // Recurring transaction link
  recurringScheduleId: text('recurring_schedule_id'),

  // Location (optional)
  location: text('location'),
  latitude: real('latitude'),
  longitude: real('longitude'),

  // Audit trail
  createdBy: text('created_by')
    .references(() => users.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by')
    .references(() => users.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => [
  // Indexes for common queries
  index('transaction_household_date_idx')
    .on(table.householdId, table.date),
  index('transaction_account_date_idx')
    .on(table.accountId, table.date),
  index('transaction_category_idx')
    .on(table.categoryId),
  index('transaction_external_id_idx')
    .on(table.externalId),
]);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

/**
 * Transaction splits - For splitting a single transaction across multiple categories
 */
export const transactionSplits = sqliteTable('transaction_splits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),

  // Split details
  amount: real('amount').notNull(),
  categoryId: text('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),
  description: text('description'),

  // Sort order for display
  sortOrder: integer('sort_order').notNull().default(0),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type TransactionSplit = typeof transactionSplits.$inferSelect;
export type NewTransactionSplit = typeof transactionSplits.$inferInsert;

/**
 * Tags - Flexible tagging for transactions
 */
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  color: text('color'), // Hex color code

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

/**
 * Transaction-Tag junction table
 */
export const transactionTags = sqliteTable('transaction_tags', {
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => [
  // Composite primary key not directly supported, use unique index
  index('unique_transaction_tag_idx')
    .on(table.transactionId, table.tagId),
]);

export type TransactionTag = typeof transactionTags.$inferSelect;
export type NewTransactionTag = typeof transactionTags.$inferInsert;

/**
 * Import batches - Track bulk imports from CSV, bank sync, etc.
 */
export const importBatches = sqliteTable('import_batches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Import source
  source: text('source').notNull(), // 'csv', 'bank_sync', 'manual', etc.
  fileName: text('file_name'),
  accountId: text('account_id')
    .references(() => accounts.id, { onDelete: 'set null' }),

  // Import stats
  totalRows: integer('total_rows').notNull().default(0),
  importedCount: integer('imported_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),

  // Status
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
  }).notNull().default('pending'),

  errorMessage: text('error_message'),

  // Who ran the import
  createdBy: text('created_by')
    .references(() => users.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export type ImportBatch = typeof importBatches.$inferSelect;
export type NewImportBatch = typeof importBatches.$inferInsert;

/**
 * Category rules - Auto-categorization rules based on patterns
 */
export const categoryRules = sqliteTable('category_rules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Rule name for display
  name: text('name').notNull(),

  // Matching criteria
  matchType: text('match_type', {
    enum: ['contains', 'starts_with', 'ends_with', 'exact', 'regex']
  }).notNull().default('contains'),
  matchField: text('match_field', {
    enum: ['description', 'merchant', 'merchant_category']
  }).notNull().default('description'),
  matchValue: text('match_value').notNull(),
  caseSensitive: integer('case_sensitive', { mode: 'boolean' }).notNull().default(false),

  // Optional: restrict to specific account
  accountId: text('account_id')
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Optional: restrict to transaction type
  transactionType: text('transaction_type', { enum: transactionTypes }),

  // Result: assign this category
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),

  // Priority (lower = higher priority)
  priority: integer('priority').notNull().default(100),

  // Is rule active?
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

  // Stats
  matchCount: integer('match_count').notNull().default(0),
  lastMatchedAt: integer('last_matched_at', { mode: 'timestamp' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type CategoryRule = typeof categoryRules.$inferSelect;
export type NewCategoryRule = typeof categoryRules.$inferInsert;

/**
 * Recurring transaction schedules
 */
export const recurringSchedules = sqliteTable('recurring_schedules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Template transaction details
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  type: text('type', { enum: transactionTypes }).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  description: text('description'),
  merchant: text('merchant'),
  categoryId: text('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),

  // For transfers
  transferAccountId: text('transfer_account_id')
    .references(() => accounts.id, { onDelete: 'set null' }),

  // Schedule
  frequency: text('frequency', {
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']
  }).notNull(),

  // For weekly: day of week (0-6, 0=Sunday)
  dayOfWeek: integer('day_of_week'),
  // For monthly/quarterly/yearly: day of month (1-31)
  dayOfMonth: integer('day_of_month'),
  // For yearly: month (1-12)
  month: integer('month'),

  // Schedule bounds
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),

  // Next occurrence
  nextOccurrence: integer('next_occurrence', { mode: 'timestamp' }),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

  // Auto-create transactions?
  autoCreate: integer('auto_create', { mode: 'boolean' }).notNull().default(false),

  // Stats
  occurrenceCount: integer('occurrence_count').notNull().default(0),
  lastOccurrence: integer('last_occurrence', { mode: 'timestamp' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type RecurringSchedule = typeof recurringSchedules.$inferSelect;
export type NewRecurringSchedule = typeof recurringSchedules.$inferInsert;
