/**
 * Transaction API Integration Tests
 * Tests the transaction CRUD endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIContext } from 'astro';
import { GET, POST } from '../index';
import { mockDrizzleDb } from '@/test/mocks/db';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: mockDrizzleDb,
}));

// Mock auth session
const mockSession = {
  user: { id: 'user-1', householdId: 'household-1' },
};

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
}));

describe('Transaction API - GET /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return transactions for authenticated user', async () => {
    const mockTransactions = [
      { id: 'txn-1', description: 'Grocery', amount: 50 },
      { id: 'txn-2', description: 'Gas', amount: 30 },
    ];

    mockDrizzleDb.query.transactions.findMany.mockResolvedValue(mockTransactions);

    const context = {
      url: new URL('http://localhost/api/transactions'),
      locals: { user: mockSession.user },
    } as unknown as APIContext;

    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].description).toBe('Grocery');
  });

  it('should filter transactions by type', async () => {
    const mockTransactions = [
      { id: 'txn-1', description: 'Salary', amount: 5000, type: 'income' },
    ];

    mockDrizzleDb.query.transactions.findMany.mockResolvedValue(mockTransactions);

    const context = {
      url: new URL('http://localhost/api/transactions?type=income'),
      locals: { user: mockSession.user },
    } as unknown as APIContext;

    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].type).toBe('income');
  });

  it('should filter transactions by date range', async () => {
    mockDrizzleDb.query.transactions.findMany.mockResolvedValue([]);

    const context = {
      url: new URL('http://localhost/api/transactions?startDate=2024-01-01&endDate=2024-01-31'),
      locals: { user: mockSession.user },
    } as unknown as APIContext;

    const response = await GET(context);

    expect(response.status).toBe(200);
  });

  it('should return 401 for unauthenticated user', async () => {
    const context = {
      url: new URL('http://localhost/api/transactions'),
      locals: {},
    } as unknown as APIContext;

    const response = await GET(context);

    expect(response.status).toBe(401);
  });
});

describe('Transaction API - POST /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new transaction', async () => {
    const newTransaction = {
      accountId: 'acc-1',
      date: '2024-01-15',
      description: 'New Transaction',
      amount: 100,
      type: 'expense',
      categoryId: 'cat-1',
    };

    mockDrizzleDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'txn-new', ...newTransaction }]),
      }),
    });

    const context = {
      request: {
        json: vi.fn().mockResolvedValue(newTransaction),
      },
      locals: { user: mockSession.user },
    } as unknown as APIContext;

    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('txn-new');
  });

  it('should validate required fields', async () => {
    const context = {
      request: {
        json: vi.fn().mockResolvedValue({ description: 'Missing fields' }),
      },
      locals: { user: mockSession.user },
    } as unknown as APIContext;

    const response = await POST(context);

    expect(response.status).toBe(400);
  });

  it('should handle transfer transactions', async () => {
    const transferTransaction = {
      accountId: 'acc-1',
      transferAccountId: 'acc-2',
      date: '2024-01-15',
      description: 'Transfer',
      amount: 500,
      type: 'transfer',
    };

    mockDrizzleDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'txn-transfer', ...transferTransaction }]),
      }),
    });

    const context = {
      request: {
        json: vi.fn().mockResolvedValue(transferTransaction),
      },
      locals: { user: mockSession.user },
    } as unknown as APIContext;

    const response = await POST(context);

    expect(response.status).toBe(201);
  });
});
