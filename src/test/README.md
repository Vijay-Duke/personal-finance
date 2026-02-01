# Testing Guide

This project uses a comprehensive testing setup with Vitest for unit/integration tests and Playwright for E2E tests.

## Test Structure

```
├── src/test/
│   ├── setup.ts              # Test environment setup
│   ├── mocks/                # Mock implementations
│   │   ├── db.ts            # Database mocks
│   │   └── integrations.ts  # External API mocks
│   └── fixtures/            # Test data
│       ├── accounts.ts
│       └── transactions.ts
├── e2e/                     # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── transactions.spec.ts
└── src/
    └── **/__tests__/        # Co-located unit tests
```

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests once (CI mode)
npx vitest run
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed
```

### All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Writing Tests

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-module';

describe('My Module', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Mocks

### Database Mocks

Use the pre-configured database mocks:

```typescript
import { mockDrizzleDb } from '@/test/mocks/db';
import { vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: mockDrizzleDb,
}));
```

### API Mocks

Use MSW (Mock Service Worker) for API mocking:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/accounts', () => {
    return HttpResponse.json([{ id: '1', name: 'Test Account' }]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test Fixtures

Use fixtures for consistent test data:

```typescript
import { mockBankAccount, mockTransaction } from '@/test/fixtures/accounts';

// In your test
const account = mockBankAccount;
const transaction = mockTransaction;
```

## Coverage Goals

| Category | Target |
|----------|--------|
| Unit tests | 70% |
| Integration tests | 50% |
| E2E tests | Critical paths |

## Critical Test Areas

1. **Financial Calculations** - Currency conversion, net worth, asset allocation
2. **Data Import** - CSV parsing, duplicate detection
3. **Auth/Security** - Login, permissions, session management
4. **External APIs** - CoinGecko, Yahoo Finance, Frankfurter
5. **Core Features** - Transactions, accounts, budgets
