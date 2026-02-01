import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Search,
  Filter,
  Plus,
  Calendar,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react';

interface TransactionTag {
  id: string;
  name: string;
  color: string | null;
}

interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  type: 'income' | 'expense' | 'transfer';
  status: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  merchant: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  notes: string | null;
  tags: TransactionTag[];
}

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface AddTransactionFormData {
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: string;
  date: string;
  description: string;
  merchant: string;
  categoryId: string;
  notes: string;
  transferAccountId: string;
}

const initialFormData: AddTransactionFormData = {
  accountId: '',
  type: 'expense',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
  merchant: '',
  categoryId: '',
  notes: '',
  transferAccountId: '',
};

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 rounded-full p-0.5"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

interface Filters {
  search: string;
  type: string;
  accountId: string;
  categoryId: string;
  status: string;
  startDate: string;
  endDate: string;
}

const initialFilters: Filters = {
  search: '',
  type: '',
  accountId: '',
  categoryId: '',
  status: '',
  startDate: '',
  endDate: '',
};

export function TransactionsList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddTransactionFormData>(initialFormData);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => key !== 'search' && value !== '').length;
  }, [filters]);

  // Fetch transactions
  const { data, isLoading, error } = useQuery<{
    transactions: Transaction[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }>({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.accountId) params.set('accountId', filters.accountId);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.status) params.set('status', filters.status);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      params.set('limit', '100');
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
  });

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Fetch accounts for dropdown
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
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

  const createMutation = useMutation({
    mutationFn: async (data: AddTransactionFormData) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: data.accountId,
          type: data.type,
          amount: parseFloat(data.amount),
          date: data.date,
          description: data.description || undefined,
          merchant: data.merchant || undefined,
          categoryId: data.categoryId || undefined,
          notes: data.notes || undefined,
          transferAccountId: data.type === 'transfer' ? data.transferAccountId : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create transaction');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowAddForm(false);
      setFormData(initialFormData);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete transaction');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    if (!data?.transactions) return [];

    const groups: { date: string; transactions: Transaction[]; total: number }[] = [];
    const grouped = new Map<string, Transaction[]>();

    data.transactions.forEach(tx => {
      const dateKey = new Date(tx.date).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(tx);
    });

    grouped.forEach((txs, dateKey) => {
      const total = txs.reduce((sum, tx) => {
        if (tx.type === 'income') return sum + tx.amount;
        if (tx.type === 'expense') return sum - tx.amount;
        return sum;
      }, 0);
      groups.push({ date: dateKey, transactions: txs, total });
    });

    return groups;
  }, [data?.transactions]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(c => c.type === formData.type || c.type === 'transfer');
  }, [categories, formData.type]);

  const TransactionIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'income':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'expense':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading transactions</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-muted', 'relative')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Filter Transactions</span>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Type Filter */}
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <select
                  value={filters.type}
                  onChange={(e) => updateFilter('type', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              {/* Account Filter */}
              <div>
                <Label className="text-xs text-muted-foreground">Account</Label>
                <select
                  value={filters.accountId}
                  onChange={(e) => updateFilter('accountId', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">All Accounts</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => updateFilter('categoryId', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="cleared">Cleared</option>
                  <option value="pending">Pending</option>
                  <option value="reconciled">Reconciled</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <Label className="text-xs text-muted-foreground">From Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="h-9"
                />
              </div>

              {/* End Date */}
              <div>
                <Label className="text-xs text-muted-foreground">To Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Active Filter Pills */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {filters.type && (
                  <FilterPill
                    label={`Type: ${filters.type}`}
                    onRemove={() => updateFilter('type', '')}
                  />
                )}
                {filters.accountId && accounts && (
                  <FilterPill
                    label={`Account: ${accounts.find(a => a.id === filters.accountId)?.name || 'Unknown'}`}
                    onRemove={() => updateFilter('accountId', '')}
                  />
                )}
                {filters.categoryId && categories && (
                  <FilterPill
                    label={`Category: ${categories.find(c => c.id === filters.categoryId)?.name || 'Unknown'}`}
                    onRemove={() => updateFilter('categoryId', '')}
                  />
                )}
                {filters.status && (
                  <FilterPill
                    label={`Status: ${filters.status}`}
                    onRemove={() => updateFilter('status', '')}
                  />
                )}
                {filters.startDate && (
                  <FilterPill
                    label={`From: ${filters.startDate}`}
                    onRemove={() => updateFilter('startDate', '')}
                  />
                )}
                {filters.endDate && (
                  <FilterPill
                    label={`To: ${filters.endDate}`}
                    onRemove={() => updateFilter('endDate', '')}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Transaction Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
            <CardDescription>Record a new income, expense, or transfer</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transaction Type */}
              <div className="flex gap-2">
                {(['expense', 'income', 'transfer'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.type === type ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type, categoryId: '' }))}
                    className="flex-1"
                  >
                    <TransactionIcon type={type} />
                    <span className="ml-2 capitalize">{type}</span>
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account *</Label>
                  <select
                    id="accountId"
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.type === 'transfer' && (
                  <div className="space-y-2">
                    <Label htmlFor="transferAccountId">To Account *</Label>
                    <select
                      id="transferAccountId"
                      name="transferAccountId"
                      value={formData.transferAccountId}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select destination</option>
                      {accounts
                        ?.filter((a) => a.id !== formData.accountId)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
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
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant</Label>
                  <Input
                    id="merchant"
                    name="merchant"
                    value={formData.merchant}
                    onChange={handleInputChange}
                    placeholder="e.g., Woolworths"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="What was this for?"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Transaction'}
                </Button>
              </div>
              {createMutation.error && (
                <p className="text-red-600 text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      {groupedTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Add your first transaction to start tracking your finances.</p>
              <Button onClick={() => setShowAddForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map((group) => (
            <Card key={group.date}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{formatDate(group.date)}</span>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      group.total >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {group.total >= 0 ? '+' : ''}
                    {formatCurrency(group.total, 'USD')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {group.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          tx.type === 'income' && 'bg-green-100',
                          tx.type === 'expense' && 'bg-red-100',
                          tx.type === 'transfer' && 'bg-blue-100'
                        )}
                      >
                        <TransactionIcon type={tx.type} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {tx.merchant || tx.description || 'Untitled'}
                          </span>
                          {tx.categoryName && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: tx.categoryColor ? `${tx.categoryColor}20` : '#e5e7eb',
                                color: tx.categoryColor || '#6b7280',
                              }}
                            >
                              {tx.categoryName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{tx.accountName}</span>
                          {tx.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <TagIcon className="h-3 w-3" />
                                {tx.tags.map((tag) => (
                                  <span key={tag.id} className="text-xs">
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={cn(
                            'font-medium',
                            tx.type === 'income' && 'text-green-600',
                            tx.type === 'expense' && 'text-red-600',
                            tx.type === 'transfer' && 'text-blue-600'
                          )}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this transaction?')) {
                            deleteMutation.mutate(tx.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {data?.pagination && data.pagination.total > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {Math.min(data.pagination.total, data.pagination.limit)} of {data.pagination.total} transactions
        </div>
      )}
    </div>
  );
}
