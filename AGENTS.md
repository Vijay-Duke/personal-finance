# AGENTS.md - Personal Finance Tracker

This file contains essential information for AI coding agents working on this project.

## Project Overview

Personal Finance Tracker is a self-hosted personal finance management application with AI-powered insights, real-time asset tracking, and comprehensive financial planning tools. It's built as a full-stack web application using Astro with React components, featuring a dark-themed luxury UI.

**Key Features:**
- Multi-account tracking (bank, investments, real estate, crypto, superannuation, etc.)
- Transaction management with CSV import
- Budget planning and financial goals
- AI-powered financial insights via chat
- Progressive Web App (PWA) with offline support
- Passkey/WebAuthn authentication

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Astro 5.2+ (Server-Side Rendering) |
| Frontend | React 19, TypeScript 5.7+ |
| Styling | Tailwind CSS 4.1+ |
| Database | SQLite with better-sqlite3 |
| ORM | Drizzle ORM 0.45+ |
| Authentication | Better Auth with two-factor support |
| AI SDK | Vercel AI SDK (OpenAI, Anthropic, Ollama support) |
| Testing | Vitest (unit), Playwright (e2e) |
| PWA | Vite PWA Plugin with Workbox |

## Project Structure

```
personal-finance/
├── src/
│   ├── components/           # React components
│   │   ├── accounts/         # Account management components
│   │   ├── ai/               # AI-related components (chat, providers)
│   │   ├── auth/             # Authentication forms
│   │   ├── budget/           # Budget components
│   │   ├── charts/           # Data visualization (recharts)
│   │   ├── dashboard/        # Dashboard widgets
│   │   ├── goals/            # Financial goals
│   │   ├── import/           # CSV import components
│   │   ├── insurance/        # Insurance tracking
│   │   ├── layout/           # Layout components (Sidebar, BottomNav)
│   │   ├── notifications/    # Notification system
│   │   ├── pages/            # Page-level components
│   │   ├── profile/          # User profile components
│   │   ├── providers/        # React context providers
│   │   ├── recurring/        # Recurring transactions
│   │   ├── settings/         # Settings components
│   │   ├── transactions/     # Transaction management
│   │   └── ui/               # Base UI components (shadcn/ui style)
│   ├── layouts/              # Astro layouts
│   │   ├── AppLayout.astro   # Main authenticated layout
│   │   └── AuthLayout.astro  # Auth page layout
│   ├── lib/                  # Utility libraries
│   │   ├── ai/               # AI integration (encryption, providers)
│   │   ├── api/              # API response helpers
│   │   ├── auth/             # Authentication config (Better Auth)
│   │   ├── db/               # Database client and schema
│   │   │   └── schema/       # Drizzle schema definitions
│   │   ├── import/           # CSV parsing logic
│   │   ├── integrations/     # External APIs (CoinGecko, Yahoo Finance)
│   │   ├── jobs/             # Background job utilities
│   │   ├── query/            # React Query client
│   │   └── utils/            # Helper functions (cn, etc.)
│   ├── pages/                # Astro pages (file-based routing)
│   │   ├── api/              # API endpoints
│   │   ├── accounts/         # Account pages
│   │   ├── auth/             # Auth pages
│   │   └── ...               # Other pages
│   ├── hooks/                # React hooks
│   │   ├── useApi.ts         # API call hook with auth
│   │   └── useFocusTrap.ts   # Accessibility hook
│   ├── test/                 # Test utilities
│   │   ├── fixtures/         # Test data
│   │   ├── mocks/            # Mock implementations
│   │   └── setup.ts          # Vitest setup
│   └── styles/               # Global styles
│       └── globals.css       # Tailwind + custom theme
├── e2e/                      # Playwright end-to-end tests
├── drizzle/                  # Database migrations
├── data/                     # SQLite database files (gitignored)
├── public/                   # Static assets
├── components.json           # shadcn/ui configuration
└── [config files]
```

## Build and Development Commands

```bash
# Development
npm run dev              # Start dev server at localhost:4321

# Building
npm run build            # Production build (runs astro check + build)
npm run preview          # Preview production build locally

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run pending migrations
npm run db:push          # Push schema changes (dev only)
npm run db:studio        # Open Drizzle Studio GUI

# Testing
npm run test             # Run Vitest unit tests
npm run test:ui          # Run Vitest with UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright e2e tests
npm run test:e2e:ui      # Run Playwright with UI mode
npm run test:all         # Run all tests (unit + e2e)
```

## Database and ORM

### Schema Organization

Database schema is organized by domain in `src/lib/db/schema/`:

- **household.ts** - Multi-tenancy base (households table)
- **user.ts** - User accounts, sessions, passkeys, 2FA
- **accounts/** - Polymorphic account types (bank, stocks, crypto, real estate, etc.)
- **transaction.ts** - Transactions, splits, tags, import batches, category rules
- **budget.ts** - Budgets, goals, insurance, projections
- **category.ts** - Transaction categories
- **ai-*.ts** - AI providers and conversations
- **integrations/** - Data sources, exchange rates, analytics
- **notifications.ts** - User notifications

### Key Conventions

1. **All tables use `householdId`** for multi-tenancy isolation
2. **Timestamps**: Use `createdAt` and `updatedAt` on all entities
3. **Soft deletes**: Use `deletedAt` where applicable
4. **Currency**: Always store with currency code (e.g., 'USD', 'AUD')
5. **Money**: Store as decimal/cents (integer) to avoid floating point issues

### Database Client Usage

```typescript
import { db } from '@/lib/db';
import { transactions, accounts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Query with joins
const results = await db
  .select({
    tx: transactions,
    accountName: accounts.name,
  })
  .from(transactions)
  .leftJoin(accounts, eq(transactions.accountId, accounts.id))
  .where(eq(transactions.householdId, householdId))
  .orderBy(desc(transactions.date));

// Transaction (atomic operations)
await db.transaction(async (tx) => {
  // Multiple operations...
});
```

## Authentication

Uses **Better Auth** with the following features:

- Email/password authentication
- Two-factor authentication (TOTP)
- Session-based auth with 7-day expiry
- Household-scoped permissions

### Auth Configuration

Located in `src/lib/auth/index.ts`. Uses Drizzle adapter with custom schema mapping.

### Checking Authentication in API Routes

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session';
import { json, unauthorized } from '@/lib/api/response';

export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }
  
  // Use session.user.householdId for all queries
  // Use session.user.id for createdBy/updatedBy
};
```

### Auth Client

```typescript
import { authClient } from '@/lib/auth/client';

// Login
await authClient.signIn.email({
  email,
  password,
  callbackURL: '/',
});

// Sign out
await authClient.signOut();
```

## API Conventions

### File Structure

API routes are in `src/pages/api/` following Astro's file-based routing:

- `index.ts` - Collection endpoints (GET list, POST create)
- `[id].ts` - Individual resource (GET, PUT, DELETE)
- `[...path].ts` - Catch-all routes

### Response Helpers

Always use standardized response helpers from `src/lib/api/response`:

```typescript
import { json, error, created, unauthorized, notFound, noContent } from '@/lib/api/response';

return json(data);                    // 200 OK
return created(data);                 // 201 Created
return noContent();                   // 204 No Content
return error('Message', 400);         // 400 Bad Request
return unauthorized('Message');       // 401 Unauthorized
return notFound('Resource');          // 404 Not Found
```

### Route Pattern Example

```typescript
import type { APIRoute } from 'astro';

// GET /api/resource
export const GET: APIRoute = async (context) => {
  // List with pagination and filters
};

// POST /api/resource
export const POST: APIRoute = async (context) => {
  // Create new resource
};
```

## Code Style Guidelines

### TypeScript

- Use **strict mode** (configured in tsconfig.json)
- Prefer `type` over `interface` for object shapes
- Use explicit return types on exported functions
- Path aliases: `@/components`, `@/lib`, `@/hooks`

### React Components

- Use **functional components** with hooks
- Props interface named `{ComponentName}Props`
- Use `cn()` utility for conditional class names
- Tailwind classes should be grouped logically

```typescript
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

export function Button({ variant = 'primary', children, className }: ButtonProps) {
  return (
    <button className={cn(
      'px-4 py-2 rounded-lg transition-colors',
      variant === 'primary' && 'bg-primary-600 text-white',
      variant === 'secondary' && 'bg-gray-200 text-gray-800',
      className
    )}>
      {children}
    </button>
  );
}
```

### Styling

- **Dark theme only** - No light mode support
- Uses custom CSS properties defined in `globals.css`
- Primary color: Muted emerald (oklch color space)
- Component pattern: `card`, `card-glass` for containers
- Always include focus styles for accessibility

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Database**: snake_case for columns, camelCase in TypeScript
- **API routes**: kebab-case for URLs

## Testing Strategy

### Unit Tests (Vitest)

- Located alongside source files or in `src/test/`
- Pattern: `*.test.ts` or `*.spec.ts`
- Environment: jsdom with happy-dom
- Setup: `src/test/setup.ts` configures mocks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock global APIs
global.fetch = vi.fn();
```

### E2E Tests (Playwright)

- Located in `e2e/` directory
- Tests against running dev server
- Supports Chromium, Firefox, WebKit, mobile viewports
- Screenshots/videos on failure

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests (starts dev server automatically)
npm run test:e2e

# All tests
npm run test:all
```

## AI Integration

### Provider Support

Located in `src/lib/ai/`:

- **OpenAI** (GPT-4, GPT-4o, GPT-3.5)
- **Anthropic** (Claude 3 family)
- **Ollama** (self-hosted)
- **Custom** (OpenAI-compatible endpoints)

### Security

- API keys are **encrypted at rest** using AES-256-GCM
- Encryption key from `ENCRYPTION_KEY` env var (min 32 chars)
- Each household configures their own AI providers

### Usage

```typescript
import { createLanguageModelFromProvider, getDefaultProvider } from '@/lib/ai/provider';
import { streamText } from 'ai';

const provider = await getDefaultProvider(householdId);
const model = createLanguageModelFromProvider(provider);

const result = streamText({
  model,
  messages: [...],
});
```

## Security Considerations

### Required Environment Variables

```env
# Authentication (min 32 characters each)
BETTER_AUTH_SECRET=...
ENCRYPTION_KEY=...

# Passkey/WebAuthn
PASSKEY_RP_ID=localhost
PASSKEY_ORIGIN=http://localhost:4321
```

### Security Checklist

- [ ] Change default secrets in production
- [ ] Deploy behind HTTPS/reverse proxy
- [ ] Enable foreign keys in SQLite (done in db/index.ts)
- [ ] Validate all user input
- [ ] Use parameterized queries (Drizzle handles this)
- [ ] Check household ownership on all data operations

### Authentication Middleware

Always verify `session.user.householdId` before data operations. Never trust client-provided IDs without verification.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path |
| `BETTER_AUTH_SECRET` | Yes | Auth signing key (≥32 chars) |
| `BETTER_AUTH_URL` | Yes | Auth callback base URL |
| `PUBLIC_BETTER_AUTH_URL` | Yes | Public auth URL |
| `ENCRYPTION_KEY` | Yes | AI key encryption (≥32 chars) |
| `PASSKEY_RP_ID` | Yes | WebAuthn RP ID |
| `PASSKEY_ORIGIN` | Yes | WebAuthn origin |
| `OPENAI_API_KEY` | No | OpenAI API access |
| `ANTHROPIC_API_KEY` | No | Anthropic API access |
| `NODE_ENV` | No | `development` or `production` |
| `HOST` | No | Server bind host |
| `PORT` | No | Server port (default: 4321) |

## Deployment

### Docker (Recommended)

```bash
# Production deployment
docker-compose up -d

# With automated backups
docker-compose --profile backup up -d
```

### Manual

```bash
npm ci
npm run build
node ./dist/server/entry.mjs
```

### Post-Deployment

1. Run database migrations: `npm run db:migrate`
2. Verify health endpoint: `GET /health`
3. Configure AI providers in app settings

## Common Tasks

### Adding a New API Endpoint

1. Create file in `src/pages/api/resource/` (index.ts for list, [id].ts for single)
2. Use `APIRoute` type from 'astro'
3. Import `getSession` and check authentication
4. Use response helpers for consistent JSON
5. Always filter by `householdId`

### Adding a Database Table

1. Create schema file in `src/lib/db/schema/`
2. Export from `src/lib/db/schema/index.ts`
3. Generate migration: `npm run db:generate`
4. Apply migration: `npm run db:migrate`

### Adding a New Page

1. Create `.astro` file in `src/pages/`
2. Use `AppLayout` for authenticated pages
3. Use `AuthLayout` for auth pages
4. Import React components as needed

## Troubleshooting

### Database locked errors
- Check WAL mode is enabled (done by default)
- Ensure single writer pattern

### Better Auth issues
- Verify `BETTER_AUTH_SECRET` is ≥32 characters
- Check `BETTER_AUTH_URL` matches actual URL

### Build fails with native modules
- Ensure `better-sqlite3` is excluded from optimization: see astro.config.mjs

## Resources

- [Astro Docs](https://docs.astro.build)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://better-auth.com)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Tailwind CSS](https://tailwindcss.com)
