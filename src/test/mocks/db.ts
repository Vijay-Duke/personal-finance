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

// Create a chainable mock that supports any method chain
function createChainableMock(returnValue: unknown = []) {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
  const handler: ProxyHandler<typeof chainable> = {
    get(target, prop: string) {
      if (prop === 'then') return undefined; // Not a promise
      if (!target[prop]) {
        target[prop] = vi.fn().mockImplementation(() => {
          return new Proxy(chainable, handler);
        });
      }
      return target[prop];
    },
  };
  // The final result when awaited or used
  const proxy = new Proxy(chainable, handler);
  // Make it iterable when used with spread or for...of
  Object.defineProperty(proxy, Symbol.iterator, {
    value: function* () {
      yield* returnValue as Iterable<unknown>;
    },
    enumerable: false,
  });
  return proxy;
}

// Mock drizzle-orm with comprehensive chainable API
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
      returning: vi.fn().mockResolvedValue([]),
      onConflictDoNothing: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
      onConflictDoUpdate: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue({}),
  }),
  select: vi.fn().mockReturnValue(createChainableMock([])),
};

vi.mock('@/lib/db', () => ({
  db: mockDrizzleDb,
}));

vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => mockDb),
}));
