/**
 * Database Mocks
 * Mock implementations for database operations
 */

import { vi } from 'vitest';

// Mock better-sqlite3
export const mockDb = {
  prepare: vi.fn().mockReturnValue({
    get: vi.fn(),
    all: vi.fn().mockReturnValue([]),
    run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
  }),
  exec: vi.fn(),
  pragma: vi.fn(),
  close: vi.fn(),
};

// Mock drizzle-orm
export const mockDrizzleDb = {
  query: {
    users: { findFirst: vi.fn(), findMany: vi.fn() },
    accounts: { findFirst: vi.fn(), findMany: vi.fn() },
    transactions: { findFirst: vi.fn(), findMany: vi.fn() },
    categories: { findFirst: vi.fn(), findMany: vi.fn() },
    dataSources: { findFirst: vi.fn(), findMany: vi.fn() },
    exchangeRates: { findFirst: vi.fn(), findMany: vi.fn() },
    netWorthSnapshots: { findFirst: vi.fn(), findMany: vi.fn() },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockReturnValue([]),
      onConflictDoNothing: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([]) }),
      onConflictDoUpdate: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([]) }),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockReturnValue([]) }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({}),
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue([]),
        }),
      }),
    }),
  }),
};

vi.mock('@/lib/db', () => ({
  db: mockDrizzleDb,
}));

vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => mockDb),
}));
