/**
 * Test Fixtures - Transactions
 * Reusable test data for transaction-related tests
 */

import type { Transaction, Category, Tag } from '@/lib/db/schema';
import { mockHouseholdId } from './accounts';

export const mockCategory: Category = {
  id: 'cat-1',
  householdId: mockHouseholdId,
  name: 'Groceries',
  type: 'expense',
  icon: 'shopping-cart',
  color: '#22c55e',
  parentId: null,
  isSystem: false,
  sortOrder: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTag: Tag = {
  id: 'tag-1',
  householdId: mockHouseholdId,
  name: 'Essential',
  color: '#3b82f6',
  createdAt: new Date('2024-01-01'),
};

export const mockTransaction: Transaction = {
  id: 'txn-1',
  householdId: mockHouseholdId,
  accountId: 'bank-acc-1',
  transferAccountId: null,
  linkedTransactionId: null,
  type: 'expense',
  status: 'cleared',
  amount: 150.50,
  currency: 'USD',
  date: new Date('2024-01-15'),
  description: 'Grocery Store',
  merchant: 'Whole Foods',
  merchantCategory: null,
  categoryId: 'cat-1',
  notes: 'Weekly groceries',
  reference: null,
  importBatchId: null,
  externalId: null,
  recurringScheduleId: null,
  location: null,
  latitude: null,
  longitude: null,
  createdBy: null,
  updatedBy: null,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

export const mockIncomeTransaction: Transaction = {
  ...mockTransaction,
  id: 'txn-2',
  description: 'Salary Deposit',
  merchant: 'ACME Corp',
  amount: 5000.00,
  type: 'income',
  categoryId: 'cat-income',
};

export const mockTransferTransaction: Transaction = {
  ...mockTransaction,
  id: 'txn-3',
  description: 'Transfer to Savings',
  merchant: null,
  amount: 1000.00,
  type: 'transfer',
  transferAccountId: 'bank-acc-2',
};

export const mockTransactions = [
  mockTransaction,
  mockIncomeTransaction,
  mockTransferTransaction,
];
