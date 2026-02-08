import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';

// Glassmorphism tooltip for bar hover
function BarTooltip({
  label,
  income,
  expenses,
  net,
  position,
  formatCurrency,
}: {
  label: string;
  income: number;
  expenses: number;
  net: number;
  position: { x: number; y: number };
  formatCurrency: (v: number) => string;
}) {
  return (
    <div
      className="absolute z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-bg-elevated/95 backdrop-blur-md border border-border/50 rounded-xl px-4 py-3 shadow-xl min-w-[180px]">
        <div className="text-sm font-medium text-text-primary mb-2">{label}</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600" />
              <span className="text-xs text-text-muted">Income</span>
            </div>
            <span className="text-sm font-medium text-success">{formatCurrency(income)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-danger to-danger-dark" />
              <span className="text-xs text-text-muted">Expenses</span>
            </div>
            <span className="text-sm font-medium text-danger">{formatCurrency(expenses)}</span>
          </div>
          <div className="border-t border-border/50 pt-1.5 flex items-center justify-between">
            <span className="text-xs text-text-muted">Net</span>
            <span className={cn(
              "text-sm font-bold",
              net >= 0 ? "text-success" : "text-danger"
            )}>
              {net >= 0 ? '+' : ''}{formatCurrency(net)}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-bg-elevated/95 border-r border-b border-border/50 transform rotate-45" />
    </div>
  );
}

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
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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
                  <span className="font-medium text-success">{formatCurrency(totalIncome)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Expenses: </span>
                  <span className="font-medium text-warning-dark">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="space-y-3 relative">
                {monthlyTrends.map((month) => (
                  <div
                    key={month.month}
                    className={cn(
                      "space-y-1 cursor-pointer transition-all rounded-lg p-1.5 -mx-1.5",
                      hoveredMonth === month.month
                        ? "bg-bg-surface/50"
                        : "hover:bg-bg-surface/30"
                    )}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                      });
                      setHoveredMonth(month.month);
                    }}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-text-primary">{formatMonth(month.month)}</span>
                      <span className={cn(
                        'font-semibold',
                        month.net >= 0 ? 'text-success' : 'text-danger'
                      )}>
                        {month.net >= 0 ? '+' : ''}{formatCurrency(month.net)}
                      </span>
                    </div>
                    <div className="flex gap-1 h-5 rounded-md overflow-hidden bg-bg-surface/50">
                      {/* Income bar with gradient */}
                      <div
                        className={cn(
                          "bg-gradient-to-r from-primary-400 to-primary-600 rounded-l-md transition-all duration-300",
                          hoveredMonth === month.month && "shadow-glow"
                        )}
                        style={{
                          width: `${(month.income / maxMonthlyValue) * 50}%`,
                          minWidth: month.income > 0 ? '4px' : '0',
                        }}
                      />
                      {/* Expense bar with gradient */}
                      <div
                        className={cn(
                          "bg-gradient-to-r from-warning to-warning-dark rounded-r-md transition-all duration-300",
                          hoveredMonth === month.month && "shadow-glow"
                        )}
                        style={{
                          width: `${(month.expenses / maxMonthlyValue) * 50}%`,
                          minWidth: month.expenses > 0 ? '4px' : '0',
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Tooltip */}
                {hoveredMonth && (
                  <div className="fixed z-50" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
                    {(() => {
                      const month = monthlyTrends.find(m => m.month === hoveredMonth);
                      if (!month) return null;
                      return (
                        <BarTooltip
                          label={formatMonth(month.month)}
                          income={month.income}
                          expenses={month.expenses}
                          net={month.net}
                          position={{ x: 0, y: 0 }}
                          formatCurrency={formatCurrency}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary-500 rounded-sm" />
                  <span>Income</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-warning rounded-sm" />
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
              {spendingByCategory.map((category, index) => (
                <div
                  key={category.categoryName}
                  className="space-y-1.5 group cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full transition-transform group-hover:scale-125"
                        style={{ backgroundColor: category.categoryColor }}
                      />
                      <span className="truncate max-w-[150px] text-text-primary group-hover:text-primary-400 transition-colors">
                        {category.categoryName}
                      </span>
                    </div>
                    <span className="text-text-muted tabular-nums">
                      <span className="font-medium text-text-secondary">{formatCurrency(category.amount)}</span>
                      <span className="ml-1.5 text-xs">({category.percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out group-hover:shadow-lg"
                      style={{
                        width: `${category.percentage}%`,
                        background: `linear-gradient(90deg, ${category.categoryColor}, ${category.categoryColor}88)`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="pt-3 mt-1 border-t border-border flex items-center justify-between text-sm">
                <span className="text-text-muted">Total Expenses</span>
                <span className="font-bold text-text-primary text-lg">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
