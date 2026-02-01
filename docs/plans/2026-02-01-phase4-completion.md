# Phase 4 Completion: Transactions & Cashflow Remaining Tasks

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining Phase 4 tasks: CSV import pipeline, category rules management, enhanced filters, spending charts, and cashflow page polish.

**Architecture:** Build CSV parser using papaparse for client-side parsing with preview. Create category rules API with pattern matching. Add Recharts for spending visualization. Enhance TransactionsList with advanced filters.

**Tech Stack:** PapaParse, Recharts, React Query, shadcn/ui, Tailwind CSS

---

## Task 1: Install Required Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install papaparse and recharts**

Run:
```bash
npm install papaparse recharts
npm install -D @types/papaparse
```

**Step 2: Verify installation**

Run:
```bash
npm list papaparse recharts
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add papaparse and recharts for CSV import and charts"
```

---

## Task 2: Create CSV Import Parser Endpoint

**Files:**
- Create: `src/pages/api/import/csv.ts`
- Create: `src/lib/import/csv-parser.ts`

**Step 1: Create CSV parser utility**

Create `src/lib/import/csv-parser.ts`:

```typescript
import Papa from 'papaparse';

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  rawData: Record<string, string>;
}

export interface CSVParsingResult {
  success: boolean;
  headers: string[];
  totalRows: number;
  parsedCount: number;
  errors: Array<{ row: number; message: string }>;
  preview: ParsedTransaction[];
  suggestedMappings: Record<string, string>;
}

// Common column name patterns
const COLUMN_PATTERNS = {
  date: [/date|dt|transaction date|posted date/i, /time|when/i],
  description: [/description|desc|narrative|payee|merchant|name|transaction/i, /details|note/i],
  amount: [/amount|amt|value|sum/i, /transaction amount/i],
  debit: [/debit|withdrawal|out|spent/i, /dr/i],
  credit: [/credit|deposit|in|received/i, /cr/i],
};

export function detectColumnMappings(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      for (const pattern of patterns) {
        if (pattern.test(normalizedHeader)) {
          mappings[field] = header;
          break;
        }
      }
      if (mappings[field]) break;
    }
  }

  return mappings;
}

export function parseAmount(
  value: string,
  type: 'single' | 'split' = 'single',
  debitValue?: string,
  creditValue?: string
): { amount: number; type: 'income' | 'expense' } | null {
  if (type === 'split' && debitValue && creditValue) {
    const debit = parseFloat(debitValue.replace(/[$,]/g, ''));
    const credit = parseFloat(creditValue.replace(/[$,]/g, ''));

    if (!isNaN(debit) && debit > 0) {
      return { amount: debit, type: 'expense' };
    }
    if (!isNaN(credit) && credit > 0) {
      return { amount: credit, type: 'income' };
    }
    return null;
  }

  // Single amount column - check for negative/positive
  const cleanValue = value.replace(/[$,]/g, '');
  const amount = parseFloat(cleanValue);

  if (isNaN(amount)) return null;

  return {
    amount: Math.abs(amount),
    type: amount < 0 ? 'expense' : 'income',
  };
}

export function parseDate(value: string): Date | null {
  if (!value) return null;

  // Try various date formats
  const formats = [
    // MM/DD/YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, fn: (m: RegExpMatchArray) => new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])) },
    // DD/MM/YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, fn: (m: RegExpMatchArray) => new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])) },
    // YYYY-MM-DD
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, fn: (m: RegExpMatchArray) => new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])) },
    // YYYY/MM/DD
    { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, fn: (m: RegExpMatchArray) => new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])) },
  ];

  for (const format of formats) {
    const match = value.match(format.regex);
    if (match) {
      const date = format.fn(match);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Fallback to native parsing
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function parseCSV(
  csvContent: string,
  mappings: {
    date: string;
    description: string;
    amount?: string;
    debit?: string;
    credit?: string;
    dateFormat?: string;
  }
): CSVParsingResult {
  const errors: Array<{ row: number; message: string }> = [];
  const preview: ParsedTransaction[] = [];

  const parseResult = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parseResult.meta.fields || [];
  const suggestedMappings = detectColumnMappings(headers);

  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach((err) => {
      errors.push({ row: err.row || 0, message: err.message });
    });
  }

  const totalRows = parseResult.data.length;
  let parsedCount = 0;

  for (let i = 0; i < Math.min(parseResult.data.length, 100); i++) {
    const row = parseResult.data[i];

    try {
      const dateValue = row[mappings.date];
      const descriptionValue = row[mappings.description];

      let amountResult: { amount: number; type: 'income' | 'expense' } | null = null;

      if (mappings.amount) {
        amountResult = parseAmount(row[mappings.amount], 'single');
      } else if (mappings.debit && mappings.credit) {
        amountResult = parseAmount('', 'split', row[mappings.debit], row[mappings.credit]);
      }

      if (!dateValue || !descriptionValue || !amountResult) {
        errors.push({ row: i + 1, message: 'Missing required fields' });
        continue;
      }

      const date = parseDate(dateValue);
      if (!date) {
        errors.push({ row: i + 1, message: 'Invalid date format' });
        continue;
      }

      preview.push({
        date,
        description: descriptionValue.trim(),
        amount: amountResult.amount,
        type: amountResult.type,
        rawData: row,
      });

      parsedCount++;
    } catch (err) {
      errors.push({ row: i + 1, message: 'Parse error' });
    }
  }

  return {
    success: errors.length === 0,
    headers,
    totalRows,
    parsedCount,
    errors: errors.slice(0, 10), // Limit errors
    preview,
    suggestedMappings,
  };
}
```

**Step 2: Create CSV import API endpoint**

Create `src/pages/api/import/csv.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { transactions, importBatches, categories, categoryRules } from '../../../lib/db/schema';
import { eq, and, like, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';
import { parseCSV, parseDate, parseAmount } from '../../../lib/import/csv-parser';

/**
 * POST /api/import/csv/preview
 * Preview CSV import without saving.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();
    const { csvContent, mappings } = body;

    if (!csvContent || !mappings?.date || !mappings?.description) {
      return error('CSV content and column mappings are required');
    }

    const result = parseCSV(csvContent, mappings);

    // Apply category rules to preview
    const rules = await db
      .select()
      .from(categoryRules)
      .where(
        and(
          eq(categoryRules.householdId, session.user.householdId),
          eq(categoryRules.isActive, true)
        )
      )
      .orderBy(desc(categoryRules.priority));

    const previewWithCategories = result.preview.map((tx) => {
      let matchedCategory: { id: string; name: string; color: string | null } | null = null;

      for (const rule of rules) {
        const fieldValue = tx.description.toLowerCase();
        const pattern = rule.matchValue.toLowerCase();

        let matches = false;
        switch (rule.matchType) {
          case 'contains':
            matches = fieldValue.includes(pattern);
            break;
          case 'starts_with':
            matches = fieldValue.startsWith(pattern);
            break;
          case 'ends_with':
            matches = fieldValue.endsWith(pattern);
            break;
          case 'exact':
            matches = fieldValue === pattern;
            break;
        }

        if (matches) {
          matchedCategory = {
            id: rule.categoryId,
            name: '', // Will be populated below
            color: null,
          };
          break;
        }
      }

      return { ...tx, suggestedCategory: matchedCategory };
    });

    // Get category names
    const categoryIds = previewWithCategories
      .map((tx) => tx.suggestedCategory?.id)
      .filter(Boolean) as string[];

    if (categoryIds.length > 0) {
      const categoryData = await db
        .select({ id: categories.id, name: categories.name, color: categories.color })
        .from(categories)
        .where(eq(categories.householdId, session.user.householdId));

      const categoryMap = new Map(categoryData.map((c) => [c.id, c]));

      previewWithCategories.forEach((tx) => {
        if (tx.suggestedCategory) {
          const cat = categoryMap.get(tx.suggestedCategory.id);
          if (cat) {
            tx.suggestedCategory.name = cat.name;
            tx.suggestedCategory.color = cat.color;
          }
        }
      });
    }

    return json({
      ...result,
      preview: previewWithCategories,
    });
  } catch (err) {
    console.error('Error parsing CSV:', err);
    return error('Failed to parse CSV', 500);
  }
};
```

**Step 3: Create CSV import execute endpoint**

Create `src/pages/api/import/csv/execute.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { transactions, importBatches, accounts } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '../../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../../lib/api/response';
import type { ParsedTransaction } from '../../../../lib/import/csv-parser';

/**
 * POST /api/import/csv/execute
 * Execute the CSV import after preview.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();
    const { accountId, transactions: txData, importBatchId } = body;

    if (!accountId || !txData || !Array.isArray(txData)) {
      return error('Account ID and transactions are required');
    }

    // Verify account belongs to household
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId));

    if (!account || account.householdId !== session.user.householdId) {
      return error('Account not found', 404);
    }

    // Create or update import batch
    let batchId = importBatchId;
    if (!batchId) {
      const [batch] = await db
        .insert(importBatches)
        .values({
          householdId: session.user.householdId,
          source: 'csv',
          accountId,
          totalRows: txData.length,
          importedCount: 0,
          skippedCount: 0,
          errorCount: 0,
          status: 'processing',
          createdBy: session.user.id,
        })
        .returning();
      batchId = batch.id;
    }

    // Insert transactions
    let importedCount = 0;
    let errorCount = 0;

    for (const tx of txData) {
      try {
        await db.insert(transactions).values({
          householdId: session.user.householdId,
          accountId,
          importBatchId: batchId,
          type: tx.type,
          status: 'cleared',
          amount: tx.amount,
          currency: account.currency || 'USD',
          date: new Date(tx.date),
          description: tx.description,
          categoryId: tx.categoryId,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        });
        importedCount++;
      } catch (err) {
        console.error('Error importing transaction:', err);
        errorCount++;
      }
    }

    // Update batch status
    await db
      .update(importBatches)
      .set({
        status: errorCount > 0 ? 'completed' : 'completed',
        importedCount,
        errorCount,
        completedAt: new Date(),
      })
      .where(eq(importBatches.id, batchId));

    return json({
      success: true,
      batchId,
      importedCount,
      errorCount,
    });
  } catch (err) {
    console.error('Error executing import:', err);
    return error('Failed to import transactions', 500);
  }
};
```

**Step 4: Commit**

```bash
git add src/lib/import/csv-parser.ts src/pages/api/import/
git commit -m "feat(import): add CSV parser and import endpoints"
```

---

## Task 3: Create Category Rules API

**Files:**
- Create: `src/pages/api/category-rules/index.ts`
- Create: `src/pages/api/category-rules/[id].ts`

**Step 1: Create category rules list/create endpoint**

Create `src/pages/api/category-rules/index.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { categoryRules, categories } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/category-rules
 * List category rules for the household.
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const rules = await db
      .select({
        id: categoryRules.id,
        name: categoryRules.name,
        matchType: categoryRules.matchType,
        matchField: categoryRules.matchField,
        matchValue: categoryRules.matchValue,
        caseSensitive: categoryRules.caseSensitive,
        categoryId: categoryRules.categoryId,
        priority: categoryRules.priority,
        isActive: categoryRules.isActive,
        matchCount: categoryRules.matchCount,
        lastMatchedAt: categoryRules.lastMatchedAt,
        createdAt: categoryRules.createdAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(categoryRules)
      .leftJoin(categories, eq(categoryRules.categoryId, categories.id))
      .where(eq(categoryRules.householdId, session.user.householdId))
      .orderBy(desc(categoryRules.priority), desc(categoryRules.createdAt));

    return json({ rules });
  } catch (err) {
    console.error('Error fetching category rules:', err);
    return error('Failed to fetch category rules', 500);
  }
};

/**
 * POST /api/category-rules
 * Create a new category rule.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    // Validate required fields
    if (!body.name || !body.matchValue || !body.categoryId) {
      return error('Name, match value, and category are required');
    }

    const [newRule] = await db
      .insert(categoryRules)
      .values({
        householdId: session.user.householdId,
        name: body.name,
        matchType: body.matchType || 'contains',
        matchField: body.matchField || 'description',
        matchValue: body.matchValue,
        caseSensitive: body.caseSensitive || false,
        categoryId: body.categoryId,
        priority: body.priority || 100,
        isActive: body.isActive ?? true,
      })
      .returning();

    return created(newRule);
  } catch (err) {
    console.error('Error creating category rule:', err);
    return error('Failed to create category rule', 500);
  }
};
```

**Step 2: Create single rule endpoint**

Create `src/pages/api/category-rules/[id].ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { categoryRules } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../../lib/auth/session';
import { json, error, unauthorized, notFound } from '../../../../lib/api/response';

/**
 * PUT /api/category-rules/[id]
 * Update a category rule.
 */
export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Rule ID is required');
  }

  try {
    const body = await context.request.json();

    // Verify rule belongs to household
    const [existing] = await db
      .select()
      .from(categoryRules)
      .where(
        and(
          eq(categoryRules.id, id),
          eq(categoryRules.householdId, session.user.householdId)
        )
      );

    if (!existing) {
      return notFound('Category rule not found');
    }

    const [updated] = await db
      .update(categoryRules)
      .set({
        name: body.name ?? existing.name,
        matchType: body.matchType ?? existing.matchType,
        matchField: body.matchField ?? existing.matchField,
        matchValue: body.matchValue ?? existing.matchValue,
        caseSensitive: body.caseSensitive ?? existing.caseSensitive,
        categoryId: body.categoryId ?? existing.categoryId,
        priority: body.priority ?? existing.priority,
        isActive: body.isActive ?? existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(categoryRules.id, id))
      .returning();

    return json(updated);
  } catch (err) {
    console.error('Error updating category rule:', err);
    return error('Failed to update category rule', 500);
  }
};

/**
 * DELETE /api/category-rules/[id]
 * Delete a category rule.
 */
export const DELETE: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const { id } = context.params;
  if (!id) {
    return error('Rule ID is required');
  }

  try {
    const result = await db
      .delete(categoryRules)
      .where(
        and(
          eq(categoryRules.id, id),
          eq(categoryRules.householdId, session.user.householdId)
        )
      );

    if (result.rowsAffected === 0) {
      return notFound('Category rule not found');
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting category rule:', err);
    return error('Failed to delete category rule', 500);
  }
};
```

**Step 3: Commit**

```bash
git add src/pages/api/category-rules/
git commit -m "feat(api): add category rules CRUD endpoints"
```

---

## Task 4: Create Category Rules Management UI

**Files:**
- Create: `src/components/settings/CategoryRulesManager.tsx`
- Create: `src/pages/settings/category-rules.astro`

**Step 1: Create category rules manager component**

Create `src/components/settings/CategoryRulesManager.tsx`:

```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Plus, Trash2, Edit2, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface CategoryRule {
  id: string;
  name: string;
  matchType: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  matchField: 'description' | 'merchant';
  matchValue: string;
  caseSensitive: boolean;
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  priority: number;
  isActive: boolean;
  matchCount: number;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export function CategoryRulesManager() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<CategoryRule | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['category-rules'],
    queryFn: async () => {
      const res = await fetch('/api/category-rules');
      if (!res.ok) throw new Error('Failed to fetch rules');
      const data = await res.json();
      return data.rules as CategoryRule[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json() as Category[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CategoryRule>) => {
      const res = await fetch('/api/category-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      setIsAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryRule> }) => {
      const res = await fetch(`/api/category-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      setEditingRule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/category-rules/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete rule');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
    },
  });

  const testRule = (text: string) => {
    const lowerText = text.toLowerCase();
    for (const rule of rules.filter((r) => r.isActive)) {
      const pattern = rule.matchValue.toLowerCase();
      let matches = false;
      switch (rule.matchType) {
        case 'contains':
          matches = lowerText.includes(pattern);
          break;
        case 'starts_with':
          matches = lowerText.startsWith(pattern);
          break;
        case 'ends_with':
          matches = lowerText.endsWith(pattern);
          break;
        case 'exact':
          matches = lowerText === pattern;
          break;
      }
      if (matches) {
        setTestResult(rule);
        return;
      }
    }
    setTestResult(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Category Rules</h2>
          <p className="text-sm text-muted-foreground">
            Automatically categorize transactions based on patterns
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category Rule</DialogTitle>
            </DialogHeader>
            <RuleForm
              categories={categories}
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Test Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Test Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter transaction description to test..."
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
            />
            <Button variant="secondary" onClick={() => testRule(testText)}>
              <Play className="w-4 h-4 mr-2" />
              Test
            </Button>
          </div>
          {testResult && (
            <p className="mt-2 text-sm">
              Would match: <span style={{ color: testResult.categoryColor || 'inherit' }}>{testResult.categoryName}</span>
            </p>
          )}
          {testText && !testResult && (
            <p className="mt-2 text-sm text-muted-foreground">No rule matches</p>
          )}
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rule.name}</span>
                    {!rule.isActive && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rule.matchField} {rule.matchType} "{rule.matchValue}"
                    {' → '}
                    <span style={{ color: rule.categoryColor || 'inherit' }}>
                      {rule.categoryName}
                    </span>
                  </p>
                  {rule.matchCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Matched {rule.matchCount} times
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ id: rule.id, data: { isActive: checked } })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingRule(rule)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category Rule</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <RuleForm
              categories={categories}
              initialData={editingRule}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editingRule.id, data })
              }
              onCancel={() => setEditingRule(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RuleFormProps {
  categories: Category[];
  initialData?: Partial<CategoryRule>;
  onSubmit: (data: Partial<CategoryRule>) => void;
  onCancel: () => void;
}

function RuleForm({ categories, initialData, onSubmit, onCancel }: RuleFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    matchType: initialData?.matchType || 'contains',
    matchField: initialData?.matchField || 'description',
    matchValue: initialData?.matchValue || '',
    caseSensitive: initialData?.caseSensitive || false,
    categoryId: initialData?.categoryId || '',
    priority: initialData?.priority || 100,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Grocery stores"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="matchField">Field</Label>
          <Select
            value={formData.matchField}
            onValueChange={(v) => setFormData({ ...formData, matchField: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="description">Description</SelectItem>
              <SelectItem value="merchant">Merchant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="matchType">Match Type</Label>
          <Select
            value={formData.matchType}
            onValueChange={(v) => setFormData({ ...formData, matchType: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contains">Contains</SelectItem>
              <SelectItem value="starts_with">Starts with</SelectItem>
              <SelectItem value="ends_with">Ends with</SelectItem>
              <SelectItem value="exact">Exact</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="matchValue">Pattern</Label>
        <Input
          id="matchValue"
          value={formData.matchValue}
          onChange={(e) => setFormData({ ...formData, matchValue: e.target.value })}
          placeholder="e.g., WALMART"
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Rule</Button>
      </div>
    </form>
  );
}
```

**Step 2: Create category rules settings page**

Create `src/pages/settings/category-rules.astro`:

```astro
---
import AppLayout from '../../layouts/AppLayout.astro';
import { CategoryRulesManager } from '../../components/settings/CategoryRulesManager';

const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/auth/login');
}
---

<AppLayout title="Category Rules | Personal Finance">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Settings</h1>
    <CategoryRulesManager client:load />
  </div>
</AppLayout>
```

**Step 3: Commit**

```bash
git add src/components/settings/CategoryRulesManager.tsx src/pages/settings/category-rules.astro
git commit -m "feat(ui): add category rules management UI"
```

---

## Task 5: Create Spending Trends Chart

**Files:**
- Create: `src/components/cashflow/SpendingChart.tsx`
- Modify: `src/pages/cashflow.astro`

**Step 1: Create spending chart component**

Create `src/components/cashflow/SpendingChart.tsx`:

```typescript
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  date: string;
  categoryName: string | null;
  categoryColor: string | null;
}

interface SpendingChartProps {
  startDate: Date;
  endDate: Date;
}

export function SpendingChart({ startDate, endDate }: SpendingChartProps) {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', 'chart', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'expense',
        limit: '1000',
      });
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      return data.transactions as Transaction[];
    },
  });

  const chartData = useMemo(() => {
    // Group by month and category
    const grouped = new Map<string, Map<string, number>>();

    transactions.forEach((tx) => {
      const month = new Date(tx.date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      const category = tx.categoryName || 'Uncategorized';

      if (!grouped.has(month)) {
        grouped.set(month, new Map());
      }
      const monthData = grouped.get(month)!;
      monthData.set(category, (monthData.get(category) || 0) + tx.amount);
    });

    // Get top categories
    const categoryTotals = new Map<string, number>();
    transactions.forEach((tx) => {
      const category = tx.categoryName || 'Uncategorized';
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + tx.amount);
    });

    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Build chart data
    const months = Array.from(grouped.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return months.map((month) => {
      const monthData = grouped.get(month)!;
      const dataPoint: Record<string, number | string> = { month };

      topCategories.forEach((cat) => {
        dataPoint[cat] = monthData.get(cat) || 0;
      });

      // Add "Other" for remaining categories
      let otherTotal = 0;
      monthData.forEach((amount, cat) => {
        if (!topCategories.includes(cat)) {
          otherTotal += amount;
        }
      });
      if (otherTotal > 0) {
        dataPoint['Other'] = otherTotal;
      }

      return dataPoint;
    });
  }, [transactions]);

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#6b7280'];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No spending data for this period
        </CardContent>
      </Card>
    );
  }

  const categories = Object.keys(chartData[0] || {}).filter((k) => k !== 'month');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(value)
              }
            />
            <Legend />
            {categories.map((category, index) => (
              <Bar
                key={category}
                dataKey={category}
                stackId="a"
                fill={colors[index % colors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Update cashflow page with chart**

Modify `src/pages/cashflow.astro`:

```astro
---
import AppLayout from '../layouts/AppLayout.astro';
import { TransactionsList } from '../components/transactions/TransactionsList';
import { SpendingChart } from '../components/cashflow/SpendingChart';
import { QueryProvider } from '../components/providers/QueryProvider';

const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/auth/login');
}

// Default to last 3 months
const endDate = new Date();
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 3);
---

<AppLayout title="Cashflow">
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Cashflow</h1>
      <p class="text-muted-foreground">
        Track your income, expenses, and transfers across all accounts.
      </p>
    </div>

    <QueryProvider client:load>
      <SpendingChart
        client:load
        startDate={startDate}
        endDate={endDate}
      />
      <TransactionsList client:load />
    </QueryProvider>
  </div>
</AppLayout>
```

**Step 3: Commit**

```bash
git add src/components/cashflow/SpendingChart.tsx src/pages/cashflow.astro
git commit -m "feat(ui): add spending trends chart to cashflow page"
```

---

## Task 6: Wire Up CSV Import UI

**Files:**
- Modify: `src/components/import/CSVImport.tsx`

**Step 1: Update CSVImport component to use backend**

Modify `src/components/import/CSVImport.tsx` to integrate with the backend endpoints. Add:
- File upload handling
- Column mapping UI
- Preview with category suggestions
- Execute import

Key additions:
- Use `parseCSV` from backend for preview
- Show column mapping dropdowns
- Display preview table with suggested categories
- Submit to `/api/import/csv/execute`

**Step 2: Add import page**

Create `src/pages/import.astro`:

```astro
---
import AppLayout from '../layouts/AppLayout.astro';
import { CSVImport } from '../components/import/CSVImport';

const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/auth/login');
}
---

<AppLayout title="Import Transactions">
  <div class="max-w-4xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Import Transactions</h1>
      <p class="text-muted-foreground">
        Import transactions from CSV files exported from your bank.
      </p>
    </div>

    <CSVImport client:load />
  </div>
</AppLayout>
```

**Step 3: Commit**

```bash
git add src/components/import/CSVImport.tsx src/pages/import.astro
git commit -m "feat(import): wire up CSV import to backend"
```

---

## Task 7: Final Build Verification

**Step 1: Run production build**

```bash
npm run build
```

**Step 2: Fix any TypeScript errors**

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors for Phase 4 completion"
```

---

## Summary

Phase 4 completion adds:

1. **CSV Import Pipeline**: PapaParse for parsing, auto column detection, category rule matching
2. **Category Rules API**: Full CRUD endpoints for managing auto-categorization rules
3. **Category Rules UI**: Management interface with rule testing
4. **Spending Charts**: Recharts integration showing spending by category over time
5. **Enhanced Cashflow Page**: Charts integrated with transaction list

**Total Tasks**: 7 tasks to complete Phase 4
