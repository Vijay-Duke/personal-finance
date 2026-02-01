import { useQuery } from '@tanstack/react-query';
import { DonutChart, DonutChartLegend } from '../charts/DonutChart';
import { EmptyAccounts } from '../ui/empty-state';
import {
  TrendingUp,
  CreditCard,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const ASSET_COLORS: Record<string, string> = {
  bank_account: '#3b82f6',
  stock: '#10b981',
  crypto: '#f59e0b',
  real_estate: '#8b5cf6',
  superannuation: '#06b6d4',
  personal_asset: '#f97316',
  business_asset: '#ec4899',
  debt: '#ef4444',
};

interface AccountBreakdown {
  type: string;
  label: string;
  value: number;
  count: number;
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  categoryName?: string;
  categoryColor?: string;
}

interface DashboardSummary {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  cashBalance: number;
  investmentValue: number;
  cryptoValue: number;
  runway?: number;
  breakdown: AccountBreakdown[];
  recentTransactions: RecentTransaction[];
  change: {
    netWorth: { value: number; percent: number };
    assets: { value: number; percent: number };
    debts: { value: number; percent: number };
  };
}

const formatCurrency = (amount: number, compact = false) => {
  if (compact && Math.abs(amount) >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Sparkline component for mini trend visualization
function Sparkline({ trend, className }: { trend: number; className?: string }) {
  const isPositive = trend >= 0;
  // Simple SVG sparkline visualization
  const points = isPositive
    ? 'M0,20 L10,18 L20,15 L30,12 L40,8 L50,5'
    : 'M0,5 L10,8 L20,12 L30,15 L40,18 L50,20';

  return (
    <svg
      viewBox="0 0 50 25"
      className={cn('w-16 h-6', className)}
      fill="none"
    >
      <path
        d={points}
        stroke={isPositive ? 'oklch(0.70 0.16 145)' : 'oklch(0.65 0.18 25)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Runway fuel gauge visualization
function RunwayGauge({ months }: { months: number }) {
  const maxMonths = 24;
  const percent = Math.min((months / maxMonths) * 100, 100);

  // Color based on runway
  const getColor = () => {
    if (months >= 12) return 'oklch(0.70 0.16 145)'; // green
    if (months >= 6) return 'oklch(0.78 0.16 85)'; // yellow
    return 'oklch(0.65 0.18 25)'; // red
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-24 h-3 bg-bg-surface rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums text-text-primary">
        {months} mo
      </span>
    </div>
  );
}

export function Dashboard() {
  const { data: summary, isLoading, error, refetch, isFetching } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Failed to fetch dashboard summary');
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Hero skeleton */}
        <div className="h-48 rounded-2xl bg-bg-elevated" />
        {/* Supporting metrics skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-xl bg-bg-elevated" />
          <div className="h-24 rounded-xl bg-bg-elevated" />
        </div>
        {/* Chart skeleton */}
        <div className="h-64 rounded-xl bg-bg-elevated" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger bg-danger-bg p-8 text-center">
        <p className="text-danger font-medium">Failed to load dashboard data</p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="mt-4"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Check if user has any data
  const hasAccounts = summary && (summary.totalAssets > 0 || summary.totalDebts > 0);

  if (!hasAccounts) {
    return (
      <div className="space-y-8">
        {/* Welcome Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary-900/30 to-bg-elevated border border-primary-800/30 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary-600/20">
              <Sparkles className="w-8 h-8 text-primary-400" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
            Welcome to Your Financial Dashboard
          </h1>
          <p className="text-text-secondary max-w-md mx-auto">
            Start by adding your first account to track your net worth and gain insights into your finances.
          </p>
        </div>

        <EmptyAccounts onAdd={() => window.location.href = '/accounts/bank'} />
      </div>
    );
  }

  const netWorthTrend = summary?.change?.netWorth?.percent ?? 0;
  const isPositiveTrend = netWorthTrend >= 0;

  return (
    <div className="space-y-6">
      {/* Hero Net Worth Card */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl p-6 md:p-8 border',
          isPositiveTrend
            ? 'bg-gradient-to-br from-success-bg/30 to-bg-elevated border-success/20'
            : 'bg-gradient-to-br from-danger-bg/30 to-bg-elevated border-danger/20'
        )}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <path
              d={isPositiveTrend
                ? 'M0 200 Q100 150 200 120 Q300 90 400 50 L400 200 Z'
                : 'M0 50 Q100 90 200 120 Q300 150 400 200 L400 50 Z'
              }
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="relative">
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => refetch()}
            className="absolute top-0 right-0"
            disabled={isFetching}
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </Button>

          {/* Label */}
          <p className="text-sm font-medium text-text-muted mb-2">Net Worth</p>

          {/* Hero Number */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="hero-number text-text-primary">
              {formatCurrency(summary?.netWorth ?? 0)}
            </span>
          </div>

          {/* Trend indicator */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                isPositiveTrend
                  ? 'bg-success/20 text-success'
                  : 'bg-danger/20 text-danger'
              )}
            >
              {isPositiveTrend ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="tabular-nums">
                {formatPercent(netWorthTrend)}
              </span>
            </div>
            <Sparkline trend={netWorthTrend} />
            <span className="text-xs text-text-muted">vs last 30 days</span>
          </div>
        </div>
      </div>

      {/* Supporting Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="rounded-xl bg-card-bg border border-border p-4 hover-lift">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-success-bg">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <span className="text-xs text-text-muted">Assets</span>
          </div>
          <p className="text-xl font-display font-bold text-text-primary tabular-nums">
            {formatCurrency(summary?.totalAssets ?? 0, true)}
          </p>
        </div>

        {/* Total Debts */}
        <div className="rounded-xl bg-card-bg border border-border p-4 hover-lift">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-danger-bg">
              <CreditCard className="w-4 h-4 text-danger" />
            </div>
            <span className="text-xs text-text-muted">Debts</span>
          </div>
          <p className="text-xl font-display font-bold text-text-primary tabular-nums">
            {formatCurrency(summary?.totalDebts ?? 0, true)}
          </p>
        </div>

        {/* Runway */}
        <div className="rounded-xl bg-card-bg border border-border p-4 hover-lift">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-info-bg">
              <Calendar className="w-4 h-4 text-info" />
            </div>
            <span className="text-xs text-text-muted">Runway</span>
          </div>
          <RunwayGauge months={summary?.runway ?? 0} />
        </div>

        {/* Cash */}
        <div className="rounded-xl bg-card-bg border border-border p-4 hover-lift">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-primary-900">
              <span className="text-xs font-bold text-primary-400">$</span>
            </div>
            <span className="text-xs text-text-muted">Cash</span>
          </div>
          <p className="text-xl font-display font-bold text-text-primary tabular-nums">
            {formatCurrency(summary?.cashBalance ?? 0, true)}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <div className="rounded-xl border border-border bg-card-bg p-6 stagger-item">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-text-primary">
              Asset Allocation
            </h2>
            <a
              href="/accounts"
              className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1"
            >
              Details <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {summary?.breakdown && summary.breakdown.filter(b => b.value > 0).length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <DonutChart
                segments={summary.breakdown
                  .filter(item => item.value > 0)
                  .map(item => ({
                    label: item.label,
                    value: item.value,
                    color: ASSET_COLORS[item.type] || '#6b7280',
                  }))}
                size={160}
                strokeWidth={24}
                centerValue={formatCurrency(summary.totalAssets, true)}
                centerLabel="Total"
              />
              <div className="flex-1 w-full max-h-48 overflow-y-auto">
                <DonutChartLegend
                  segments={summary.breakdown
                    .filter(item => item.value > 0)
                    .map(item => ({
                      label: item.label,
                      value: item.value,
                      color: ASSET_COLORS[item.type] || '#6b7280',
                    }))}
                  total={summary.totalAssets}
                  formatValue={formatCurrency}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-text-muted">
              <p>No assets to display</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card-bg p-6 stagger-item">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-text-primary">
              Recent Activity
            </h2>
            <a
              href="/cashflow"
              className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {summary.recentTransactions.slice(0, 5).map((tx, index) => (
                <a
                  key={tx.id}
                  href={`/cashflow?transaction=${tx.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-surface transition-colors stagger-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Category color dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tx.categoryColor || '#6b7280' }}
                  />

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-text-muted">
                      {tx.categoryName || 'Uncategorized'} &middot; {formatDate(tx.date)}
                    </p>
                  </div>

                  {/* Amount */}
                  <p
                    className={cn(
                      'text-sm font-medium tabular-nums',
                      tx.type === 'income' ? 'text-success' : 'text-text-primary'
                    )}
                  >
                    {tx.type === 'income' ? '+' : ''}
                    {formatCurrency(tx.amount)}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
              <p className="mb-2">No transactions yet</p>
              <a
                href="/cashflow?action=add"
                className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1"
              >
                Add transaction <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Prompt */}
      <a
        href="/ai"
        className="block rounded-xl bg-gradient-to-r from-primary-900/30 to-primary-800/20 border border-primary-700/30 p-6 hover:from-primary-900/40 hover:to-primary-800/30 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-600/20 group-hover:bg-primary-600/30 transition-colors">
            <Sparkles className="w-6 h-6 text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-text-primary mb-1">
              Get AI Insights
            </h3>
            <p className="text-sm text-text-muted">
              Ask questions about your finances and get personalized recommendations
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </a>
    </div>
  );
}
