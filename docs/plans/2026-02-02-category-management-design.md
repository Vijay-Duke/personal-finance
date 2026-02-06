# Category Management Feature Design

**Date:** 2026-02-02
**Status:** Approved

## Problem

The application has no way to manage transaction categories:
- Categories table exists but is empty
- "Add Budget" button is disabled (requires expense categories)
- Transaction category dropdown shows only "No category"
- No UI to create/edit/delete categories

## Solution

Two-part solution:
1. **Auto-seed default categories** when households are created
2. **Category management UI** in Settings for customization

## Implementation

### 1. Auto-Seeding Categories

**When:** During household creation
**What:** 17 default categories from `src/lib/db/schema/category.ts`:
- 4 income: Salary, Investments, Gifts, Other Income
- 12 expense: Housing, Utilities, Groceries, Transportation, Healthcare, Insurance, Dining Out, Entertainment, Shopping, Travel, Subscriptions, Personal Care, Debt Payments, Savings, Investments
- 1 system: Uncategorized (cannot be deleted)

**Migration:** One-time script to seed categories for existing households.

### 2. Categories Management UI

**Location:** New section in Settings page

**Features:**
- List categories grouped by type (Income/Expense)
- Add new category: name, type, color, icon
- Edit existing category
- Delete category (blocked for system categories)

**UI Components:**
- Settings section with category list
- Add/Edit modal form
- Color picker (10 preset colors)
- Icon selector (Lucide icons subset)

### 3. API Endpoints

Existing:
- `GET /api/categories` - List all
- `POST /api/categories` - Create new

New:
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

## Files to Change

| File | Change |
|------|--------|
| `src/components/settings/CategoriesManager.tsx` | New - Management UI |
| `src/pages/api/categories/[id].ts` | New - PUT/DELETE endpoints |
| `src/pages/settings.astro` | Add Categories section |
| `src/components/settings/SettingsNav.tsx` | Add Categories nav item |
| Household creation | Add category seeding |

## Design Decisions

- **Flat structure only** - No subcategories for simplicity (schema supports it for future)
- **Preset colors** - 10 curated colors vs full color picker
- **Icon subset** - ~20 relevant Lucide icons vs full library
- **System categories** - "Uncategorized" cannot be deleted
