import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from './household';

/**
 * Category types.
 */
export const categoryTypes = ['income', 'expense', 'transfer'] as const;
export type CategoryType = typeof categoryTypes[number];

/**
 * Category - Transaction categorization with support for hierarchical categories.
 */
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  
  // Category details
  name: text('name').notNull(),
  type: text('type', { enum: categoryTypes }).notNull(),
  
  // Visual customization
  icon: text('icon'),
  color: text('color'), // Hex color code
  
  // Hierarchy support (subcategories)
  parentId: text('parent_id'),
  
  // System categories cannot be deleted (e.g., "Uncategorized")
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
  
  // Sort order for display
  sortOrder: integer('sort_order').notNull().default(0),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

/**
 * Default system categories to seed.
 */
export const defaultCategories: { name: string; type: CategoryType; icon: string; color: string }[] = [
  // Income
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e' },
  { name: 'Investments', type: 'income', icon: 'trending-up', color: '#10b981' },
  { name: 'Gifts', type: 'income', icon: 'gift', color: '#34d399' },
  { name: 'Other Income', type: 'income', icon: 'dollar-sign', color: '#6ee7b7' },
  
  // Expense - Essential
  { name: 'Housing', type: 'expense', icon: 'home', color: '#ef4444' },
  { name: 'Utilities', type: 'expense', icon: 'zap', color: '#f97316' },
  { name: 'Groceries', type: 'expense', icon: 'shopping-cart', color: '#f59e0b' },
  { name: 'Transportation', type: 'expense', icon: 'car', color: '#eab308' },
  { name: 'Healthcare', type: 'expense', icon: 'heart-pulse', color: '#ec4899' },
  { name: 'Insurance', type: 'expense', icon: 'shield', color: '#8b5cf6' },
  
  // Expense - Discretionary
  { name: 'Dining Out', type: 'expense', icon: 'utensils', color: '#3b82f6' },
  { name: 'Entertainment', type: 'expense', icon: 'film', color: '#06b6d4' },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#14b8a6' },
  { name: 'Travel', type: 'expense', icon: 'plane', color: '#8b5cf6' },
  { name: 'Subscriptions', type: 'expense', icon: 'repeat', color: '#a855f7' },
  { name: 'Personal Care', type: 'expense', icon: 'sparkles', color: '#d946ef' },
  
  // Expense - Financial
  { name: 'Debt Payments', type: 'expense', icon: 'credit-card', color: '#dc2626' },
  { name: 'Savings', type: 'expense', icon: 'piggy-bank', color: '#16a34a' },
  { name: 'Investments', type: 'expense', icon: 'bar-chart-2', color: '#0891b2' },
  
  // Uncategorized (system)
  { name: 'Uncategorized', type: 'expense', icon: 'help-circle', color: '#9ca3af' },
];
