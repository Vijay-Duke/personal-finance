import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  categoryName: string | null;
  categoryColor: string | null;
}

interface SpendingByCategory {
  categoryName: string;
  categoryColor: string;
  amount: number;
  count: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface SpendingTrendsProps {
  months?: number;
}

export function SpendingTrends({ months = 6 }: SpendingTrendsProps) {
  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [months]);

  // Fetch transactions
  const { data, isLoading } = useQuery<{
    transactions: Transaction[];
    pagination: { total: number };
  }>({
    queryKey: ['transactions', 'trends', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: '1000',
      });
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
  });

  // Calculate spending by category
  const spendingByCategory = useMemo((): SpendingByCategory[] => {
    if (!data?.transactions) return [];

    const categoryMap = new Map<string, { amount: number; count: number; color: string }>();

    data.transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const name = tx.categoryName || 'Uncategorized';
        const existing = categoryMap.get(name) || { amount: 0, count: 0, color: tx.categoryColor || '#6b7280' };
        existing.amount += tx.amount;
        existing.count += 1;
        categoryMap.set(name, existing);
      });

    const total = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.amount, 0);

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        categoryName: name,
        categoryColor: data.color,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [data?.transactions]);

  // Calculate monthly trends
  const monthlyTrends = useMemo((): MonthlyTrend[] => {
    if (!data?.transactions) return [];

    const monthMap = new Map<string, { income: number; expenses: number }>();

    data.transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthMap.get(monthKey) || { income: 0, expenses: 0 };
      if (tx.type === 'income') {
        existing.income += tx.amount;
      } else if (tx.type === 'expense') {
        existing.expenses += tx.amount;
      }
      monthMap.set(monthKey, existing);
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data?.transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Calculate max values for bar scaling
  const maxMonthlyValue = useMemo(() => {
    return Math.max(
      ...monthlyTrends.flatMap(m => [m.income, m.expenses]),
      1
    );
  }, [monthlyTrends]);

  const totalExpenses = spendingByCategory.reduce((sum, c) => sum + c.amount, 0);
  const totalIncome = data?.transactions
    ?.filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Income vs Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>No transaction data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Total Income: </span>
                  <span className="font-medium text-green-600">{formatCurrency(totalIncome)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Expenses: </span>
                  <span className="font-medium text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="space-y-3">
                {monthlyTrends.map((month) => (
                  <div key={month.month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{formatMonth(month.month)}</span>
                      <span className={cn(
                        'font-medium',
                        month.net >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {month.net >= 0 ? '+' : ''}{formatCurrency(month.net)}
                      </span>
                    </div>
                    <div className="flex gap-1 h-4">
                      {/* Income bar */}
                      <div
                        className="bg-green-500 rounded-sm transition-all"
                        style={{ width: `${(month.income / maxMonthlyValue) * 50}%` }}
                        title={`Income: ${formatCurrency(month.income)}`}
                      />
                      {/* Expense bar */}
                      <div
                        className="bg-red-500 rounded-sm transition-all"
                        style={{ width: `${(month.expenses / maxMonthlyValue) * 50}%` }}
                        title={`Expenses: ${formatCurrency(month.expenses)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm" />
                  <span>Income</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-sm" />
                  <span>Expenses</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {spendingByCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>No expense data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {spendingByCategory.map((category) => (
                <div key={category.categoryName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.categoryColor }}
                      />
                      <span className="truncate max-w-[150px]">{category.categoryName}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.categoryColor,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="pt-2 border-t flex items-center justify-between text-sm font-medium">
                <span>Total Expenses</span>
                <span>{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
