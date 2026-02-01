import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Edit2,
  Zap,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface CategoryRule {
  id: string;
  name: string;
  matchType: 'contains' | 'starts_with' | 'ends_with' | 'exact' | 'regex';
  matchField: 'description' | 'merchant' | 'merchant_category';
  matchValue: string;
  caseSensitive: boolean;
  accountId: string | null;
  transactionType: 'income' | 'expense' | 'transfer' | null;
  categoryId: string;
  priority: number;
  isActive: boolean;
  matchCount: number;
  lastMatchedAt: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  accountName: string | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface FormData {
  name: string;
  matchType: string;
  matchField: string;
  matchValue: string;
  caseSensitive: boolean;
  accountId: string;
  transactionType: string;
  categoryId: string;
  priority: string;
}

const initialFormData: FormData = {
  name: '',
  matchType: 'contains',
  matchField: 'description',
  matchValue: '',
  caseSensitive: false,
  accountId: '',
  transactionType: '',
  categoryId: '',
  priority: '100',
};

const matchTypeLabels: Record<string, string> = {
  contains: 'Contains',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  exact: 'Exact match',
  regex: 'Regex pattern',
};

const matchFieldLabels: Record<string, string> = {
  description: 'Description',
  merchant: 'Merchant',
  merchant_category: 'Merchant Category',
};

export function CategoryRulesManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const queryClient = useQueryClient();

  // Fetch rules
  const { data: rules, isLoading } = useQuery<CategoryRule[]>({
    queryKey: ['category-rules'],
    queryFn: async () => {
      const res = await fetch('/api/category-rules');
      if (!res.ok) throw new Error('Failed to fetch rules');
      return res.json();
    },
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch accounts for dropdown
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/category-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          matchType: data.matchType,
          matchField: data.matchField,
          matchValue: data.matchValue,
          caseSensitive: data.caseSensitive,
          accountId: data.accountId || undefined,
          transactionType: data.transactionType || undefined,
          categoryId: data.categoryId,
          priority: parseInt(data.priority) || 100,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create rule');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const res = await fetch(`/api/category-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          matchType: data.matchType,
          matchField: data.matchField,
          matchValue: data.matchValue,
          caseSensitive: data.caseSensitive,
          accountId: data.accountId || null,
          transactionType: data.transactionType || null,
          categoryId: data.categoryId,
          priority: parseInt(data.priority || '100'),
        }),
      });
      if (!res.ok) throw new Error('Failed to update rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      setEditingId(null);
      setFormData(initialFormData);
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/category-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/category-rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete rule');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (rule: CategoryRule) => {
    setFormData({
      name: rule.name,
      matchType: rule.matchType,
      matchField: rule.matchField,
      matchValue: rule.matchValue,
      caseSensitive: rule.caseSensitive,
      accountId: rule.accountId || '',
      transactionType: rule.transactionType || '',
      categoryId: rule.categoryId,
      priority: String(rule.priority),
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData(initialFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Group rules by category
  const groupedRules = useMemo(() => {
    if (!rules) return new Map();
    const groups = new Map<string, CategoryRule[]>();
    rules.forEach(rule => {
      const key = rule.categoryName || 'Uncategorized';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(rule);
    });
    return groups;
  }, [rules]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Auto-Categorization Rules</h2>
          <p className="text-sm text-muted-foreground">
            Create rules to automatically categorize imported transactions
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Rule' : 'Create New Rule'}</CardTitle>
            <CardDescription>
              Define a pattern to match and the category to assign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rule Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Amazon Purchases"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Assign Category *</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select category</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Match Field */}
                <div className="space-y-2">
                  <Label htmlFor="matchField">Match Field</Label>
                  <select
                    id="matchField"
                    name="matchField"
                    value={formData.matchField}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="description">Description</option>
                    <option value="merchant">Merchant</option>
                    <option value="merchant_category">Merchant Category</option>
                  </select>
                </div>

                {/* Match Type */}
                <div className="space-y-2">
                  <Label htmlFor="matchType">Match Type</Label>
                  <select
                    id="matchType"
                    name="matchType"
                    value={formData.matchType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="contains">Contains</option>
                    <option value="starts_with">Starts with</option>
                    <option value="ends_with">Ends with</option>
                    <option value="exact">Exact match</option>
                    <option value="regex">Regex pattern</option>
                  </select>
                </div>

                {/* Match Value */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="matchValue">Match Pattern *</Label>
                  <Input
                    id="matchValue"
                    name="matchValue"
                    value={formData.matchValue}
                    onChange={handleInputChange}
                    placeholder="e.g., AMAZON or AMZN*"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The text to match against the selected field
                  </p>
                </div>

                {/* Transaction Type (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="transactionType">Transaction Type (optional)</Label>
                  <select
                    id="transactionType"
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Any type</option>
                    <option value="income">Income only</option>
                    <option value="expense">Expense only</option>
                    <option value="transfer">Transfer only</option>
                  </select>
                </div>

                {/* Account (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account (optional)</Label>
                  <select
                    id="accountId"
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Any account</option>
                    {accounts?.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    name="priority"
                    type="number"
                    value={formData.priority}
                    onChange={handleInputChange}
                    min="1"
                    max="999"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers = higher priority (1-999)
                  </p>
                </div>

                {/* Case Sensitive */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="caseSensitive"
                      checked={formData.caseSensitive}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-input"
                    />
                    Case sensitive matching
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingId
                      ? 'Update Rule'
                      : 'Create Rule'}
                </Button>
              </div>
              {(createMutation.error || updateMutation.error) && (
                <p className="text-red-600 text-sm">
                  {(createMutation.error || updateMutation.error)?.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      {rules && rules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No categorization rules yet</p>
              <p className="text-sm mt-1">
                Create rules to automatically categorize your imported transactions
              </p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedRules.entries()).map(([categoryName, rulesInCategory]) => (
            <Card key={categoryName}>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: rulesInCategory[0]?.categoryColor || '#6b7280' }}
                  />
                  {categoryName}
                  <span className="text-muted-foreground font-normal text-sm">
                    ({rulesInCategory.length} rule{rulesInCategory.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {rulesInCategory.map((rule: CategoryRule) => (
                    <div
                      key={rule.id}
                      className={cn(
                        'flex items-center gap-4 px-4 py-3',
                        !rule.isActive && 'opacity-50'
                      )}
                    >
                      {/* Toggle Active */}
                      <button
                        onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                        className="text-muted-foreground hover:text-foreground"
                        title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>

                      {/* Rule Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rule.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted">
                            Priority: {rule.priority}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {matchFieldLabels[rule.matchField]}{' '}
                          <span className="font-medium">{matchTypeLabels[rule.matchType]}</span>:{' '}
                          <code className="px-1 py-0.5 bg-muted rounded text-xs">
                            {rule.matchValue}
                          </code>
                          {rule.accountName && (
                            <span className="ml-2">• Account: {rule.accountName}</span>
                          )}
                          {rule.transactionType && (
                            <span className="ml-2">• Type: {rule.transactionType}</span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right text-sm text-muted-foreground hidden sm:block">
                        <div>{rule.matchCount} matches</div>
                        {rule.lastMatchedAt && (
                          <div className="text-xs">
                            Last: {new Date(rule.lastMatchedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(rule)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => {
                            if (confirm('Delete this rule?')) {
                              deleteMutation.mutate(rule.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
