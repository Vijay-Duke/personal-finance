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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface Budget {
  id: string;
  categoryId: string;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  categoryType: string | null;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  periodStart: string | null;
  rolloverEnabled: boolean;
  rolloverAmount: number | null;
  alertThreshold: number | null;
  alertEnabled: boolean;
  notes: string | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  categoryId: string | null;
  date: string;
}

interface FormData {
  categoryId: string;
  amount: string;
  period: string;
  alertThreshold: string;
  alertEnabled: boolean;
  rolloverEnabled: boolean;
  notes: string;
}

const initialFormData: FormData = {
  categoryId: '',
  amount: '',
  period: 'monthly',
  alertThreshold: '80',
  alertEnabled: true,
  rolloverEnabled: false,
  notes: '',
};

export function BudgetsList() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const queryClient = useQueryClient();

  // Current period for calculations
  const currentPeriod = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Fetch budgets
  const { data: budgets, isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await fetch('/api/budgets');
      if (!res.ok) throw new Error('Failed to fetch budgets');
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

  // Fetch transactions for the current month to calculate spending
  const { data: transactionsData } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ['transactions', 'budget-period', currentPeriod],
    queryFn: async () => {
      const startDate = `${currentPeriod}-01`;
      const endDate = new Date(
        parseInt(currentPeriod.split('-')[0]),
        parseInt(currentPeriod.split('-')[1]),
        0
      ).toISOString().split('T')[0];

      const params = new URLSearchParams({
        startDate,
        endDate,
        type: 'expense',
        limit: '1000',
      });
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) return { transactions: [] };
      return res.json();
    },
  });

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const spending = new Map<string, number>();
    transactionsData?.transactions?.forEach(tx => {
      if (tx.categoryId && tx.type === 'expense') {
        spending.set(tx.categoryId, (spending.get(tx.categoryId) || 0) + tx.amount);
      }
    });
    return spending;
  }, [transactionsData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: data.categoryId,
          amount: parseFloat(data.amount),
          period: data.period,
          alertThreshold: parseFloat(data.alertThreshold),
          alertEnabled: data.alertEnabled,
          rolloverEnabled: data.rolloverEnabled,
          notes: data.notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create budget');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data.amount ? parseFloat(data.amount) : undefined,
          period: data.period,
          alertThreshold: data.alertThreshold ? parseFloat(data.alertThreshold) : undefined,
          alertEnabled: data.alertEnabled,
          rolloverEnabled: data.rolloverEnabled,
          notes: data.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to update budget');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setEditingId(null);
      setFormData(initialFormData);
      setShowForm(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete budget');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (budget: Budget) => {
    setFormData({
      categoryId: budget.categoryId,
      amount: String(budget.amount),
      period: budget.period,
      alertThreshold: String(budget.alertThreshold || 80),
      alertEnabled: budget.alertEnabled,
      rolloverEnabled: budget.rolloverEnabled,
      notes: budget.notes || '',
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData(initialFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!budgets) return { budgeted: 0, spent: 0 };

    const budgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const spent = budgets.reduce((sum, b) => {
      return sum + (spendingByCategory.get(b.categoryId) || 0);
    }, 0);

    return { budgeted, spent };
  }, [budgets, spendingByCategory]);

  // Filter out categories that already have budgets
  const availableCategories = useMemo(() => {
    if (!categories || !budgets) return [];
    const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId));
    return categories.filter(c => !budgetedCategoryIds.has(c.id) && c.type === 'expense');
  }, [categories, budgets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totals.budgeted)}</div>
            <div className="text-sm text-muted-foreground">Total Budgeted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totals.spent)}</div>
            <div className="text-sm text-muted-foreground">Spent This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={cn(
              "text-2xl font-bold",
              totals.budgeted - totals.spent >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(totals.budgeted - totals.spent)}
            </div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Category Budgets</h2>
          <p className="text-sm text-muted-foreground">
            Set spending limits for each category
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm || availableCategories.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Budget' : 'Create Budget'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingId && (
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category *</Label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select category</option>
                      {availableCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Budget Amount *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <select
                    id="period"
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alertThreshold">Alert at % spent</Label>
                  <Input
                    id="alertThreshold"
                    name="alertThreshold"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.alertThreshold}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="alertEnabled"
                      checked={formData.alertEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-input"
                    />
                    Enable alerts
                  </Label>

                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rolloverEnabled"
                      checked={formData.rolloverEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-input"
                    />
                    Rollover unused
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      {!budgets || budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No budgets set</p>
              <p className="text-sm mt-1">Create budgets to track spending by category</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map(budget => {
            const spent = spendingByCategory.get(budget.categoryId) || 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const remaining = budget.amount - spent;
            const isOverBudget = remaining < 0;
            const isNearLimit = percentage >= (budget.alertThreshold || 80) && !isOverBudget;

            return (
              <Card key={budget.id} className={cn(isOverBudget && "border-red-200")}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Category Color */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: budget.categoryColor || '#6b7280' }}
                    />

                    {/* Budget Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{budget.categoryName}</span>
                          {isOverBudget && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                              Over budget
                            </span>
                          )}
                          {isNearLimit && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isOverBudget ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}% used
                        </span>
                        <span className={cn(
                          "text-xs font-medium",
                          isOverBudget ? "text-red-600" : "text-green-600"
                        )}>
                          {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining))} {isOverBudget ? 'over' : 'left'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(budget)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => {
                          if (confirm('Delete this budget?')) {
                            deleteMutation.mutate(budget.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
