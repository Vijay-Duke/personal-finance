# Personal Finance App - Design Document

**Date:** 2026-02-01
**Status:** Ready for Implementation
**Inspiration:** [Kuber](https://getkuber.app/), [Maybe Finance](https://github.com/maybe-finance/maybe)

---

## 1. Project Overview

### Vision
A self-hosted, privacy-first personal finance app with full feature parity to Kuber/Maybe Finance, powered by user-provided AI, built on a modern TypeScript stack.

### Key Differentiators
- **Self-hosted only** - Full data ownership, no cloud dependency
- **AI-powered** - Users bring their own OpenAI/Anthropic/Ollama keys
- **Modern stack** - Astro, React, TanStack, SQLite
- **Global support** - Multi-currency, CSV import (no Plaid dependency)
- **Comprehensive** - All asset types, budgeting, goals, retirement planning

### Target Users
- Privacy-conscious individuals wanting control over financial data
- Technical users comfortable with Docker self-hosting
- Households wanting shared finance tracking with granular permissions

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Astro 5 (SSR mode) | Fast, minimal JS, great for dashboards |
| **UI Library** | React 19 | Interactive islands for complex components |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Consistent, accessible components |
| **State/Data** | TanStack Query + TanStack Table | Best-in-class data fetching and tables |
| **Database** | SQLite + Drizzle ORM | Zero-config, single-file, type-safe |
| **Auth** | Better Auth | Modern auth with 2FA, passkeys built-in |
| **Charts** | Recharts | React-native charting |
| **AI** | Vercel AI SDK | Provider-agnostic (OpenAI, Anthropic, Ollama) |
| **Deployment** | Docker | Easy self-hosting |

---

## 3. Data Model

### Core Entities

#### Users & Households
```
User
├── id: string (uuid)
├── email: string (unique)
├── name: string
├── householdId: string (FK)
├── role: 'owner' | 'member'
├── createdAt: timestamp
└── updatedAt: timestamp

Household
├── id: string (uuid)
├── name: string
├── primaryCurrency: string (ISO 4217)
├── financialYearStart: number (1-12)
├── createdAt: timestamp
└── updatedAt: timestamp

UserFinancialProfile
├── id: string (uuid)
├── userId: string (FK, unique)
├── dateOfBirth: date (nullable)
├── targetRetirementAge: number (nullable)
├── riskTolerance: 'conservative' | 'moderate' | 'aggressive' (nullable)
├── annualIncome: decimal (nullable)
├── incomeFrequency: 'weekly' | 'fortnightly' | 'monthly' | 'yearly'
├── taxBracket: string (nullable)
├── lifeExpectancy: number (default: 85)
└── estimatedMonthlyExpense: decimal (nullable)

UserAccountPermission
├── userId: string (FK)
├── accountId: string (FK)
└── permissionLevel: 'readonly' | 'full_access' | 'hidden'
```

#### Accounts (Assets)
```
Account (base entity)
├── id: string (uuid)
├── householdId: string (FK)
├── name: string
├── type: 'bank_account' | 'stock' | 'crypto' | 'real_estate' |
│         'superannuation' | 'personal_asset' | 'business_asset'
├── currency: string (ISO 4217)
├── isActive: boolean (default: true)
├── isLiquid: boolean (default: true)
├── expectedAnnualReturnRate: decimal (nullable)
├── notes: text (nullable)
├── createdAt: timestamp
└── updatedAt: timestamp

BankAccount (extends Account)
├── accountId: string (FK)
├── bankName: string
├── accountNumber: string (encrypted, nullable)
├── accountType: 'checking' | 'savings' | 'money_market' | 'cd' | 'other'
└── balance: decimal

Stock (extends Account)
├── accountId: string (FK)
├── symbol: string
├── exchange: string (nullable)
├── shares: decimal
├── avgCostBasis: decimal
└── broker: string (nullable)

Crypto (extends Account)
├── accountId: string (FK)
├── symbol: string
├── network: string (nullable)
├── holdings: decimal
├── avgCostBasis: decimal
└── walletAddress: string (nullable)

RealEstate (extends Account)
├── accountId: string (FK)
├── address: string
├── propertyType: 'house' | 'apartment' | 'land' | 'commercial' | 'other'
├── purchasePrice: decimal
├── purchaseDate: date
├── currentValue: decimal
└── mortgageId: string (FK to Debt, nullable)

Superannuation (extends Account)
├── accountId: string (FK)
├── fundName: string
├── memberNumber: string (nullable)
├── balance: decimal
└── employer: string (nullable)

PersonalAsset (extends Account)
├── accountId: string (FK)
├── category: 'vehicle' | 'jewelry' | 'art' | 'collectible' | 'electronics' | 'other'
├── description: text
├── purchasePrice: decimal
├── purchaseDate: date (nullable)
└── currentValue: decimal

BusinessAsset (extends Account)
├── accountId: string (FK)
├── businessName: string
├── ownershipPercentage: decimal
├── businessType: string
├── currentValue: decimal
└── vestingSchedule: json (nullable)
```

#### Liabilities
```
Debt
├── id: string (uuid)
├── householdId: string (FK)
├── name: string
├── type: 'mortgage' | 'credit_card' | 'personal_loan' |
│         'student_loan' | 'car_loan' | 'other'
├── currency: string (ISO 4217)
├── lender: string (nullable)
├── originalAmount: decimal
├── currentBalance: decimal
├── interestRate: decimal (nullable)
├── minimumPayment: decimal (nullable)
├── paymentDueDay: number (1-31, nullable)
├── startDate: date (nullable)
├── endDate: date (nullable)
├── isActive: boolean (default: true)
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### Transactions & Cashflow
```
Transaction
├── id: string (uuid)
├── householdId: string (FK)
├── accountId: string (FK)
├── importBatchId: string (FK, nullable)
├── date: date
├── description: string
├── rawDescription: string (original from import)
├── amount: decimal
├── currency: string (ISO 4217)
├── type: 'income' | 'expense' | 'transfer'
├── categoryId: string (FK, nullable)
├── status: 'pending' | 'cleared' | 'reconciled'
├── linkedTransactionId: string (FK, nullable) -- for transfers
├── notes: text (nullable)
├── isRecurring: boolean (default: false)
├── recurringScheduleId: string (FK, nullable)
├── createdAt: timestamp
└── updatedAt: timestamp

TransactionSplit
├── id: string (uuid)
├── transactionId: string (FK)
├── categoryId: string (FK)
├── amount: decimal
└── description: string (nullable)

Tag
├── id: string (uuid)
├── householdId: string (FK)
├── name: string
└── color: string (hex)

TransactionTag
├── transactionId: string (FK)
└── tagId: string (FK)

Category
├── id: string (uuid)
├── householdId: string (FK)
├── name: string
├── type: 'income' | 'expense' | 'transfer'
├── icon: string (nullable)
├── color: string (hex, nullable)
├── parentId: string (FK, nullable) -- for subcategories
├── isSystem: boolean (default: false)
└── sortOrder: number

CategoryRule
├── id: string (uuid)
├── householdId: string (FK)
├── pattern: string (regex or contains)
├── patternType: 'contains' | 'regex' | 'exact'
├── categoryId: string (FK)
├── priority: number (higher = first)
├── isAI: boolean (default: false)
├── isActive: boolean (default: true)
└── createdAt: timestamp

RecurringTransactionSchedule
├── id: string (uuid)
├── householdId: string (FK)
├── accountId: string (FK)
├── description: string
├── amount: decimal
├── categoryId: string (FK, nullable)
├── type: 'income' | 'expense'
├── frequency: 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'yearly'
├── interval: number (default: 1)
├── dayOfWeek: number (0-6, nullable)
├── dayOfMonth: number (1-31 or -1 for last, nullable)
├── startDate: date
├── endDate: date (nullable)
├── isActive: boolean (default: true)
├── lastGeneratedDate: date (nullable)
└── createdAt: timestamp

ImportBatch
├── id: string (uuid)
├── householdId: string (FK)
├── accountId: string (FK)
├── filename: string
├── fileType: 'csv' | 'xlsx' | 'ofx' | 'qif'
├── transactionCount: number
├── status: 'pending' | 'processing' | 'completed' | 'failed'
├── errorMessage: text (nullable)
├── importedAt: timestamp
└── createdAt: timestamp

Budget
├── id: string (uuid)
├── householdId: string (FK)
├── categoryId: string (FK)
├── month: string (YYYY-MM)
├── amount: decimal
├── rollover: boolean (default: false)
└── createdAt: timestamp
```

#### Goals & Planning
```
Goal
├── id: string (uuid)
├── householdId: string (FK)
├── name: string
├── description: text (nullable)
├── targetAmount: decimal
├── currentAmount: decimal (computed or manual)
├── targetDate: date (nullable)
├── category: 'emergency_fund' | 'house' | 'car' | 'vacation' |
│             'retirement' | 'education' | 'other'
├── linkedAccountIds: json (array of account IDs)
├── icon: string (nullable)
├── color: string (hex, nullable)
├── isCompleted: boolean (default: false)
├── completedAt: timestamp (nullable)
└── createdAt: timestamp

FinancialProjection
├── id: string (uuid)
├── householdId: string (FK)
├── description: string
├── type: 'income' | 'expense'
├── amount: decimal
├── frequency: 'once' | 'monthly' | 'yearly'
├── startDate: date
├── endDate: date (nullable)
├── isActive: boolean (default: true)
└── createdAt: timestamp

InsurancePolicy
├── id: string (uuid)
├── householdId: string (FK)
├── name: string
├── type: 'life' | 'health' | 'home' | 'auto' | 'disability' |
│         'umbrella' | 'other'
├── provider: string
├── policyNumber: string (nullable)
├── premium: decimal
├── premiumFrequency: 'monthly' | 'quarterly' | 'yearly'
├── coverageAmount: decimal (nullable)
├── deductible: decimal (nullable)
├── startDate: date
├── expiryDate: date (nullable)
├── autoRenew: boolean (default: false)
├── notes: text (nullable)
└── createdAt: timestamp
```

#### Valuations & History
```
ValuationHistory
├── id: string (uuid)
├── accountId: string (FK)
├── date: date
├── value: decimal
├── source: 'manual' | 'api' | 'import'
└── createdAt: timestamp

ExchangeRate
├── id: string (uuid)
├── fromCurrency: string (ISO 4217)
├── toCurrency: string (ISO 4217)
├── rate: decimal
├── date: date
└── source: string

NetWorthSnapshot
├── id: string (uuid)
├── householdId: string (FK)
├── date: date
├── totalAssets: decimal
├── totalLiabilities: decimal
├── netWorth: decimal
├── breakdown: json (by asset type)
└── createdAt: timestamp

MonthlyAnalyticsRollup
├── id: string (uuid)
├── householdId: string (FK)
├── month: string (YYYY-MM)
├── categoryId: string (FK, nullable)
├── totalIncome: decimal
├── totalExpense: decimal
├── transactionCount: number
└── createdAt: timestamp
```

#### AI & Settings
```
AIProvider
├── id: string (uuid)
├── householdId: string (FK)
├── name: string
├── provider: 'openai' | 'anthropic' | 'ollama' | 'custom'
├── baseUrl: string (nullable)
├── apiKey: string (encrypted)
├── model: string
├── isDefault: boolean (default: false)
├── isActive: boolean (default: true)
└── createdAt: timestamp

AIConversation
├── id: string (uuid)
├── householdId: string (FK)
├── userId: string (FK)
├── title: string (nullable)
├── messages: json
├── createdAt: timestamp
└── updatedAt: timestamp

DataSource
├── id: string (uuid)
├── householdId: string (FK)
├── type: 'stock' | 'crypto' | 'forex' | 'property' | 'metal'
├── provider: string
├── apiKey: string (encrypted, nullable)
├── isEnabled: boolean (default: true)
├── syncFrequency: 'realtime' | 'hourly' | 'daily'
├── lastSyncAt: timestamp (nullable)
└── createdAt: timestamp

Notification
├── id: string (uuid)
├── householdId: string (FK)
├── userId: string (FK, nullable) -- null = all household members
├── type: 'bill_reminder' | 'goal_milestone' | 'budget_alert' |
│         'price_alert' | 'insurance_renewal' | 'system'
├── title: string
├── message: text
├── actionUrl: string (nullable)
├── isRead: boolean (default: false)
├── readAt: timestamp (nullable)
└── createdAt: timestamp
```

---

## 4. API Integrations

### External Data Sources

| Data Type | Provider | API | Rate Limit (Free) |
|-----------|----------|-----|-------------------|
| **Stocks/ETFs** | Yahoo Finance | yfinance | Unlimited |
| **Stocks/ETFs** | Alpha Vantage | REST | 25/day |
| **Crypto** | CoinGecko | REST | 30/min |
| **Exchange Rates** | Frankfurter | REST | Unlimited |
| **Exchange Rates** | Open Exchange Rates | REST | 1000/month |
| **Precious Metals** | Metals.dev | REST | 50/day |
| **Property (US)** | Zillow | Limited | Varies |
| **Property (AU)** | Domain | Limited | Varies |

### Sync Strategy
- **Exchange Rates:** Daily sync at midnight UTC
- **Stock Prices:** On-demand + hourly during market hours
- **Crypto Prices:** Real-time on page load, cached 5 minutes
- **Property Values:** Manual trigger or monthly reminder

---

## 5. UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ SIDEBAR (240px, dark)           │ MAIN CONTENT (flex, light)   │
│                                 │                               │
│ [Logo] App Name                 │ ┌───────────────────────────┐ │
│                                 │ │ Breadcrumb / Page Title   │ │
│ Dashboard                       │ │ [Actions]                 │ │
│                                 │ └───────────────────────────┘ │
│ ASSETS                          │                               │
│   Bank Accounts                 │ ┌───────────────────────────┐ │
│   Stocks & ETFs                 │ │                           │ │
│   Crypto                        │ │   Page Content            │ │
│   Real Estate                   │ │   (Cards, Tables, etc.)   │ │
│   Superannuation                │ │                           │ │
│   Personal Assets               │ └───────────────────────────┘ │
│   Business Assets               │                               │
│                                 │                               │
│ LIABILITIES                     │                               │
│   Debts                         │                               │
│                                 │ ┌───────────────────────────┐ │
│ MANAGEMENT                      │ │ AI Chat (collapsible)     │ │
│   Goals                         │ └───────────────────────────┘ │
│   Cashflow                      │                               │
│   Budgets                       │                               │
│   Insurance                     │                               │
│                                 │                               │
│ ─────────────                   │                               │
│ Settings                        │                               │
│ [Avatar] User Name              │                               │
└─────────────────────────────────────────────────────────────────┘
```

### Color Palette (Kuber-inspired)
```css
--sidebar-bg: #0f1419        /* Dark charcoal */
--sidebar-text: #e7e9ea      /* Light gray */
--sidebar-accent: #10b981    /* Emerald/mint green */
--content-bg: #ffffff        /* White */
--card-bg: #f8fafc           /* Slate 50 */
--text-primary: #0f172a      /* Slate 900 */
--text-secondary: #64748b    /* Slate 500 */
--accent: #10b981            /* Emerald 500 */
--danger: #ef4444            /* Red 500 */
--warning: #f59e0b           /* Amber 500 */
--success: #22c55e           /* Green 500 */
```

### Key Pages

#### Dashboard
- Net Worth card (large, prominent)
- Assets vs Liabilities summary cards
- Net Worth trend chart (line chart, time range selector)
- AI Insights card
- Portfolio allocation (donut chart)
- Quick actions (Add Transaction, Add Asset)
- Recent transactions

#### Asset Pages (Bank Accounts, Stocks, etc.)
- Total value header with trend indicator
- List/table of items with key metrics
- Value trend chart
- Add new button
- Edit/delete actions

#### Cashflow
- Period selector (This Month, This FY, Custom)
- Spending breakdown cards (Essential, Discretionary, etc.)
- Transaction list with filters
- Import CSV button
- Category rules management
- Spending trends chart

#### Goals
- Goal cards with progress bars
- Target date countdown
- Add goal modal
- Link accounts to goals

### Mobile Responsiveness
- Sidebar collapses to hamburger menu
- Cards stack vertically
- Tables become cards on mobile
- Bottom navigation bar on mobile
- PWA with offline support

---

## 6. AI Features

### Provider Configuration
Users configure their own AI provider in Settings:
- OpenAI (gpt-4o, gpt-4o-mini)
- Anthropic (claude-sonnet, claude-haiku)
- Ollama (local models)
- Custom OpenAI-compatible endpoints

### AI Capabilities

| Feature | Trigger | Behavior |
|---------|---------|----------|
| **Auto-Categorization** | CSV import | AI suggests categories, user confirms |
| **Natural Language Queries** | Chat panel | "How much on groceries last month?" |
| **Spending Insights** | Dashboard | Weekly analysis, anomaly detection |
| **Budget Suggestions** | Budget page | Based on spending patterns |
| **Goal Recommendations** | Goals page | Savings rate optimization |
| **Retirement Projections** | Profile | Based on age, savings, expenses |
| **Bill Detection** | Import | Identify recurring transactions |

### Privacy
- All AI calls server-side (user's own instance)
- Data never leaves server except to chosen AI provider
- Ollama option for 100% local/offline AI

---

## 7. Authentication & Security

### Better Auth Configuration
- Email/password authentication
- Two-factor authentication (TOTP)
- Passkey support (WebAuthn)
- Session management
- Password reset flow

### Security Measures
- All sensitive fields encrypted at rest (API keys, account numbers)
- HTTPS enforced
- CSRF protection
- Rate limiting on auth endpoints
- Secure session cookies

### Household Permissions
- Owner: Full access, can manage members
- Member: Access based on UserAccountPermission
- Per-account visibility control

---

## 8. Project Structure

```
personal-finance/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Sidebar, Header, etc.
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── assets/             # Asset management
│   │   ├── transactions/       # Transaction components
│   │   ├── charts/             # Chart wrappers
│   │   └── ai/                 # AI chat panel
│   │
│   ├── layouts/
│   │   ├── AppLayout.astro
│   │   └── AuthLayout.astro
│   │
│   ├── pages/
│   │   ├── index.astro         # Dashboard
│   │   ├── auth/
│   │   ├── bank-accounts/
│   │   ├── stocks/
│   │   ├── crypto/
│   │   ├── real-estate/
│   │   ├── superannuation/
│   │   ├── personal-assets/
│   │   ├── business-assets/
│   │   ├── debts/
│   │   ├── goals/
│   │   ├── cashflow/
│   │   ├── budgets/
│   │   ├── insurance/
│   │   ├── settings/
│   │   ├── profile/
│   │   └── api/
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── index.ts
│   │   ├── auth/
│   │   ├── ai/
│   │   ├── integrations/       # External API clients
│   │   ├── utils/
│   │   └── validations/
│   │
│   └── styles/
│       └── globals.css
│
├── public/
├── drizzle.config.ts
├── astro.config.mjs
├── tailwind.config.js
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Astro, Tailwind, shadcn/ui)
- [ ] Database schema (Drizzle + SQLite)
- [ ] Better Auth integration
- [ ] App layout (sidebar, routing)
- [ ] Basic dashboard shell

### Phase 2: Core Assets (Week 3-4)
- [ ] Bank accounts CRUD
- [ ] Stocks & ETFs CRUD
- [ ] Crypto CRUD
- [ ] Valuation history tracking
- [ ] Dashboard net worth calculation

### Phase 3: Extended Assets & Liabilities (Week 5-6)
- [ ] Real estate with mortgage linking
- [ ] Superannuation
- [ ] Personal & business assets
- [ ] Debts management
- [ ] Dashboard asset allocation

### Phase 4: Transactions & Cashflow (Week 7-8)
- [ ] Transaction CRUD
- [ ] CSV import with parsing
- [ ] Category management
- [ ] Category rules
- [ ] Cashflow dashboard

### Phase 5: Budgeting & Goals (Week 9-10)
- [ ] Budget creation per category
- [ ] Budget vs actual tracking
- [ ] Goals CRUD
- [ ] Goal progress tracking
- [ ] Insurance policies

### Phase 6: AI Integration (Week 11-12)
- [ ] AI provider configuration
- [ ] Chat panel UI
- [ ] Natural language queries
- [ ] Auto-categorization
- [ ] Spending insights

### Phase 7: API Integrations (Week 13-14)
- [ ] CoinGecko (crypto prices)
- [ ] Yahoo Finance (stock prices)
- [ ] Frankfurter (exchange rates)
- [ ] Metals.dev (precious metals)
- [ ] Scheduled sync jobs

### Phase 8: Polish & PWA (Week 15-16)
- [ ] Mobile responsiveness
- [ ] PWA manifest & service worker
- [ ] Notifications system
- [ ] Data export/backup
- [ ] Docker optimization
- [ ] Documentation

---

## 10. Deployment

### Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=file:/app/data/finance.db
      - AUTH_SECRET=${AUTH_SECRET}
    restart: unless-stopped
```

### Quick Start
```bash
# Clone and start
git clone https://github.com/your-repo/personal-finance.git
cd personal-finance
cp .env.example .env
# Edit .env with your AUTH_SECRET
docker-compose up -d
# Open http://localhost:3000
```

---

## 11. Future Considerations (Post v1)

- [ ] Stock options & vesting schedules
- [ ] Tax tracking & reporting
- [ ] Multi-household support
- [ ] Shared household invites via link
- [ ] Audit logging
- [ ] Bank statement PDF parsing (OCR)
- [ ] Mobile native apps (React Native)
- [ ] Plaid integration (optional, for US users)
- [ ] Investment recommendations
- [ ] Debt payoff strategies (avalanche/snowball)

---

## Appendix: Entity Relationship Diagram

```
Household ─────┬───── User ─────── UserFinancialProfile
               │         │
               │         └──── UserAccountPermission ────┐
               │                                         │
               ├───── Account ───────────────────────────┤
               │         │                               │
               │         ├── BankAccount                 │
               │         ├── Stock                       │
               │         ├── Crypto                      │
               │         ├── RealEstate ─── Debt         │
               │         ├── Superannuation              │
               │         ├── PersonalAsset               │
               │         └── BusinessAsset               │
               │                   │                     │
               │                   └── ValuationHistory  │
               │                                         │
               ├───── Debt ──────────────────────────────┘
               │
               ├───── Transaction ─┬── TransactionSplit
               │         │         └── TransactionTag ── Tag
               │         │
               │         └── ImportBatch
               │
               ├───── Category ────── CategoryRule
               │         │
               │         └── Budget
               │
               ├───── RecurringTransactionSchedule
               │
               ├───── Goal
               │
               ├───── FinancialProjection
               │
               ├───── InsurancePolicy
               │
               ├───── AIProvider
               │
               ├───── AIConversation
               │
               ├───── DataSource
               │
               ├───── Notification
               │
               ├───── NetWorthSnapshot
               │
               └───── MonthlyAnalyticsRollup

ExchangeRate (standalone - shared across households)
```
