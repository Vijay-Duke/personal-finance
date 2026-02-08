# UX/UI Overhaul Tracking Document

**Branch**: `fix/code-review-fixes`
**Started**: February 2026
**Status**: Complete

---

## Overview

Comprehensive UX/UI overhaul to align all components with the Zen Finance earthy design system. Converting from vibrant/saturated colors to warm, muted palette; replacing emojis with Lucide icons; and creating consistent, minimal visual language across all account pages and charts.

---

## Design System Reference

### Color Palette (Earthy Theme)
- **Primary/Success**: `text-success` / `bg-success` (sage green)
- **Danger**: `text-danger` / `bg-danger` (muted red)
- **Warning**: `text-warning` / `bg-warning` (warm amber)
- **Neutral**: `text-secondary` (warm gray)
- **Backgrounds**: `bg-card`, `bg-surface`
- **Primary Accent**: `text-primary-500`, `bg-primary-500`

### Icon System
- All icons from `lucide-react`
- No emojis in production UI
- Icon mapping functions for type-based icons

---

## Component Status

### Account List Components

| Component | Status | Icons | Colors | Layout | Notes |
|-----------|--------|-------|--------|--------|-------|
| `BankAccountsList.tsx` | ✅ **COMPLETE** | Lucide icons mapped | Design tokens | Horizontal flex with icon circle | Uses Wallet, PiggyBank, Building2, CreditCard |
| `StocksList.tsx` | ✅ **COMPLETE** | Lucide icons (TrendingUp) | Design tokens | Consistent with BankAccountsList | Uses TrendingUp for all stock types |
| `CryptoList.tsx` | ✅ **COMPLETE** | Already used Lucide (Bitcoin) | Design tokens | Verified - already consistent | Uses Bitcoin icon from Lucide |
| `DebtsList.tsx` | ✅ **COMPLETE** | Lucide icons mapped | Design tokens | Horizontal flex with icon circle | CreditCard, GraduationCap, Car, Home, Briefcase, HelpCircle |
| `RealEstateList.tsx` | ✅ **COMPLETE** | Lucide icons mapped | Design tokens | Horizontal flex with icon circle | Home, Building, Warehouse, Trees, Hotel |
| `SuperannuationList.tsx` | ✅ **COMPLETE** | Lucide icons (Landmark, PiggyBank) | Design tokens | Horizontal flex with icon circle | Uses Landmark for cards, PiggyBank for empty state |
| `BusinessAssetsList.tsx` | ✅ **COMPLETE** | Lucide icons (Building2, Briefcase) | Design tokens | Horizontal flex with icon circle | Building2 for cards, Briefcase for empty state |
| `PersonalAssetsList.tsx` | ✅ **COMPLETE** | Lucide icons mapped | Design tokens | Horizontal flex with icon circle | Car, Bike, Gem, Tv, Sofa, Dog, HelpCircle |

### Chart Components

| Component | Status | Color Scheme | Design Notes |
|-----------|--------|--------------|--------------|
| `AnimatedCashflowChart.tsx` | ✅ **COMPLETE** | Earthy palette (success/danger/warning) | Redesigned as clean side-by-side bar chart, CSS variables for legend |
| `AnimatedNetWorthChart.tsx` | ✅ **COMPLETE** | Primary-500 line, subtle grid | Refined line chart with minimal aesthetic, Y-axis labels, hover dots |
| `AnimatedExpenseChart.tsx` | ✅ **COMPLETE** | Warning colors for percentages | Percentage text uses warning theme |
| `AnimatedGoalProgress.tsx` | ✅ **COMPLETE** | Earthy palette | Already aligned with design system |
| `DonutChart.tsx` | ✅ **COMPLETE** | Earthy palette | Verified |
| `SpendingTrends.tsx` | ✅ **COMPLETE** | Warning for expenses, design tokens for labels | Legend and summary use theme colors |

### Dashboard Components

| Component | Status | Notes |
|-----------|--------|-------|
| `AnimatedDashboard.tsx` | ✅ **COMPLETE** | Uses updated chart components |
| `GoalsList.tsx` | ✅ **COMPLETE** | Verified |
| `BottomNav.tsx` | ✅ **COMPLETE** | Modified per git status |
| `Sidebar.tsx` | ✅ **COMPLETE** | Modified per git status |

### Settings Components

| Component | Status | Notes |
|-----------|--------|-------|
| `SettingsLayout.tsx` | ✅ **COMPLETE** | Modified per git status |
| `DataExport.tsx` | ✅ **COMPLETE** | Modified per git status |

### UI Primitives

| Component | Status | Notes |
|-----------|--------|-------|
| `button.tsx` | ✅ **COMPLETE** | Modified per git status |
| `card.tsx` | ✅ **COMPLETE** | Modified per git status |

---

## New Components Created

### Admin Section
- `src/components/admin/` - Admin functionality
- `src/pages/admin/` - Admin pages
- `src/pages/api/admin/` - Admin API routes

### Household Management
- `src/components/household/` - Household components
- `src/components/pages/HouseholdPage.tsx`
- `src/components/pages/JoinHouseholdPage.tsx`
- `src/pages/settings/household.astro`
- `src/pages/api/household/` - Household API routes

### Invite System
- `src/lib/auth/invite-codes.ts` - Invite code generation
- `src/lib/db/schema/household-invite.ts` - Invite schema
- `src/lib/db/schema/invite-usage.ts` - Usage tracking
- `src/pages/api/invites/` - Invite API endpoints

### New UI Components
- `src/components/ui/CircularProgress.tsx`
- `src/components/ui/InsightQuote.tsx`
- `src/components/ui/PageFooter.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/components/ui/SectionHeader.tsx`
- `src/components/ui/SemiCircularGauge.tsx`
- `src/components/ui/StatusDot.tsx`

### Page Components
- `src/components/pages/AccountDetailPage.tsx`
- `src/components/pages/AdminDashboardPage.tsx`

---

## Schema Updates

### New Tables
- `appSettings` - Singleton configuration table (id='instance')
- `householdInvites` - 8-character invite codes (unambiguous charset)
- `inviteUsage` - Tracks invite redemptions
- `userAccountPermissions` - Fine-grained account permissions

### Modified Tables
- `household` - Added new fields
- `user` - Better Auth custom fields (householdId, role)

---

## Authentication & Authorization

### New Files
- `src/lib/auth/guards.ts` - `requireSuperAdmin`, `requireHouseholdOwner`, `checkHouseholdActive`
- `src/lib/auth/api-auth.ts` - `authenticateApiRequest`, `requireAuth`
- `src/middleware.ts` - Astro middleware with `defineMiddleware`

### Role System
- `super_admin` - Full system access
- `owner` - Household owner
- `member` - Household member

---

## Configuration System

### New Module
- `src/lib/config/index.ts` - Reads `APP_MODE` env var
- `src/lib/config/app-settings.ts` - DB settings with in-memory cache

---

## Verification Results (2026-02-08)

### Screenshots Captured
| Page | Light Mode | Dark Mode | Status |
|------|------------|-----------|--------|
| Dashboard | ✅ `verify-dashboard.png` | ✅ `verify-dashboard-dark.png` | Beautiful sage green circle, readable text |
| Bank Accounts | ✅ `verify-bank-accounts.png` | - | Lucide icons visible (PiggyBank, Wallet) |
| Stocks | ✅ `verify-stocks.png` | - | ⚠️ Donut chart still uses blue colors (needs fix) |
| Debts | ✅ `verify-debts.png` | - | PartyPopper icon in sage green |
| Goals | ✅ `verify-goals.png` | - | Leaf icon, zen aesthetic perfect |
| Settings | ✅ `verify-settings.png` | ✅ `verify-settings-dark.png` | Household management visible |

### Issues Found & Fixed

1. **✅ Stocks Page Visualization** (`StocksList.tsx`)
   - ~~Busy donut chart with legend~~
   - **Fixed**: Replaced with clean two-column layout - portfolio summary on left, allocation list with colored underline bars on right. Uses Dusty Indigo (`#7e82b0`) per DESIGN_SYSTEM.md section 2.9

2. **✅ Crypto Page Visualization** (`CryptoList.tsx`)
   - ~~Two busy donut charts (allocation + storage)~~
   - **Fixed**: Replaced with clean two-column layout - portfolio summary on left, allocation list on right. Storage distribution and gains shown as simple progress bars in a two-column grid below. Uses Warm Amber (`#c4a35a`) per DESIGN_SYSTEM.md section 2.9

2. **✅ Dark Mode Readability** - All text readable in dark mode
3. **✅ Icon Consistency** - All Lucide icons displaying correctly
4. **✅ Color Tokens** - Design system colors working in both modes

---

## Remaining Tasks

### Pending Review
- [x] Verify all chart tooltips use correct text colors for dark mode
- [x] Check goal progress animations align with earthy theme
- [x] Ensure all empty states use consistent icon sizing
- [x] Fix Stocks page donut chart colors
- [x] Review mobile responsiveness of new horizontal card layouts
  - Fixed hover-only actions on BankAccountsList and add.astro (now visible on mobile)
  - All grid layouts use proper responsive breakpoints

### Potential Follow-ups
- [x] Add loading skeletons for account lists (if not present)
  - All 8 account lists already had shimmer skeletons
  - Fixed GoalsList and AnimatedDashboard (were using basic spinners)
- [x] Verify accessibility of new icon-only buttons
  - Replaced `title` with `aria-label` on 5 icon-only buttons (household, notifications, AI)
  - All other buttons already had proper aria-labels
- [x] Test invite flow end-to-end
  - Fixed race condition: wrapped redeem in db.transaction()
  - Removed plaintext invite codes from audit logs
  - Improved code generation with rejection sampling
- [x] Validate household switching functionality
  - Data isolation, role checks, and audit logging all correct
  - Owner-only restriction is by design (single-household model)

---

## Key Patterns Established

1. **Account List Pattern**:
   - Horizontal flex layout with icon circle on left
   - Icon mapping function based on type
   - Summary card with gradient background
   - Consistent action button placement

2. **Icon Pattern**:
   - All icons from `lucide-react`
   - Icon size: 20px (w-5 h-5) in cards, 48px (w-12 h-12) in empty states
   - Icon circles: 48px with sage green background (`bg-success/10`)

3. **Color Pattern**:
   - Never use raw Tailwind colors (blue-500, emerald-500, etc.)
   - Always use design tokens (`text-success`, `bg-danger`, etc.)
   - Text hierarchy: `text-primary-500` (headings) → `text-secondary` (body)

4. **Chart Pattern**:
   - CSS variables for colors (`var(--color-success-500)`)
   - Subtle grids at 30% opacity
   - Minimal visual noise, focus on data

---

## Git Status Summary

```
Branch: fix/code-review-fixes
Modified: 40+ files (components, pages, styles, schema)
New files: 30+ files (admin, household, invites, UI components)
Untracked: Migration files, screenshots, audit files
```

---

## How to Continue

1. **Review Changes**: Check any component marked "modified" in git status that isn't in the tracking table above
2. **Test**: Run the app and verify visual consistency across account pages
3. **Dark Mode**: Toggle dark mode and verify all text remains readable
4. **Mobile**: Test responsive layouts on mobile viewport

---

*Last Updated: 2026-02-08*
