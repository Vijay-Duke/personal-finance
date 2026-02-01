import { useQuery } from '@tanstack/react-query';
import { StatCard } from './StatCard';
import { DonutChart, DonutChartLegend } from '../charts/DonutChart';
import { SpendingTrends } from '../charts/SpendingTrends';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Building2,
  Coins,
  Banknote,
} from 'lucide-react';

const ASSET_COLORS: Record<string, string> = {
  bank_account: '#3b82f6', // blue
  stock: '#10b981', // green
  crypto: '#f59e0b', // amber
  real_estate: '#8b5cf6', // purple
  superannuation: '#06b6d4', // cyan
  personal_asset: '#f97316', // orange
  business_asset: '#ec4899', // pink
  debt: '#ef4444', // red
};

interface AccountBreakdown {
  type: string;
  label: string;
  value: number;
  count: number;
}

interface DashboardSummary {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  cashBalance: number;
  investmentValue: number;
  cryptoValue: number;
  breakdown: AccountBreakdown[];
  change: {
    netWorth: { value: number; percent: number };
  };
}

const formatCurrency = (amount: number) => {
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

export function Dashboard() {
  const { data: summary, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Failed to fetch dashboard summary');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const stats = [
    {
      title: 'Net Worth',
      value: summary ? formatCurrency(summary.netWorth) : '$0.00',
      change: summary && summary.change.netWorth.percent !== 0
        ? {
            value: formatPercent(summary.change.netWorth.percent),
            trend: summary.change.netWorth.percent >= 0 ? 'up' as const : 'down' as const
          }
        : undefined,
      icon: Wallet,
      iconColor: 'bg-primary-100 text-primary-600',
    },
    {
      title: 'Total Assets',
      value: summary ? formatCurrency(summary.totalAssets) : '$0.00',
      icon: TrendingUp,
      iconColor: 'bg-success/10 text-success',
    },
    {
      title: 'Total Debts',
      value: summary ? formatCurrency(summary.totalDebts) : '$0.00',
      icon: CreditCard,
      iconColor: 'bg-danger/10 text-danger',
    },
    {
      title: 'Cash Balance',
      value: summary ? formatCurrency(summary.cashBalance) : '$0.00',
      icon: Banknote,
      iconColor: 'bg-info/10 text-info',
    },
    {
      title: 'Investments',
      value: summary ? formatCurrency(summary.investmentValue) : '$0.00',
      icon: Building2,
      iconColor: 'bg-warning/10 text-warning',
    },
    {
      title: 'Crypto',
      value: summary ? formatCurrency(summary.cryptoValue) : '$0.00',
      icon: Coins,
      iconColor: 'bg-purple-100 text-purple-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-content-bg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger bg-danger/10 p-6 text-center">
        <p className="text-danger">Failed to load dashboard data</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* Net Worth Chart Placeholder */}
      <div className="rounded-xl border border-border bg-card-bg p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Net Worth Over Time</h2>
          <div className="flex gap-2">
            {['1W', '1M', '3M', '1Y', 'All'].map((period) => (
              <button
                key={period}
                className="rounded-md px-3 py-1 text-sm text-text-muted hover:bg-content-bg hover:text-text-primary"
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="flex h-64 items-center justify-center text-text-muted">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p className="mt-2">Add accounts to see your net worth trend</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Asset Allocation */}
        <div className="rounded-xl border border-border bg-card-bg p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Asset Allocation</h2>
          {summary?.breakdown && summary.breakdown.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <DonutChart
                segments={summary.breakdown
                  .filter(item => item.value > 0)
                  .map(item => ({
                    label: item.label,
                    value: item.value,
                    color: ASSET_COLORS[item.type] || '#6b7280',
                  }))}
                size={180}
                strokeWidth={28}
                centerValue={formatCurrency(summary.totalAssets)}
                centerLabel="Total Assets"
              />
              <div className="flex-1 w-full">
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
            <div className="flex h-48 items-center justify-center text-text-muted">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="mt-2">Add accounts to see allocation</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border border-border bg-card-bg p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Recent Transactions</h2>
            <a href="/cashflow" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </a>
          </div>
          <div className="flex h-48 items-center justify-center text-text-muted">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2">No transactions yet</p>
              <a href="/cashflow" className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700">
                Add transaction
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Trends */}
      <SpendingTrends months={6} />

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card-bg p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <a
            href="/accounts/bank"
            className="flex flex-col items-center rounded-lg border border-border p-4 text-center transition-colors hover:border-primary-600 hover:bg-content-bg"
          >
            <Banknote className="h-6 w-6 text-primary-600" />
            <span className="mt-2 text-sm text-text-primary">Add Bank Account</span>
          </a>
          <a
            href="/accounts/stocks"
            className="flex flex-col items-center rounded-lg border border-border p-4 text-center transition-colors hover:border-primary-600 hover:bg-content-bg"
          >
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <span className="mt-2 text-sm text-text-primary">Add Stock</span>
          </a>
          <a
            href="/accounts/crypto"
            className="flex flex-col items-center rounded-lg border border-border p-4 text-center transition-colors hover:border-primary-600 hover:bg-content-bg"
          >
            <Coins className="h-6 w-6 text-primary-600" />
            <span className="mt-2 text-sm text-text-primary">Add Crypto</span>
          </a>
          <a
            href="/accounts"
            className="flex flex-col items-center rounded-lg border border-border p-4 text-center transition-colors hover:border-primary-600 hover:bg-content-bg"
          >
            <Wallet className="h-6 w-6 text-primary-600" />
            <span className="mt-2 text-sm text-text-primary">All Accounts</span>
          </a>
        </div>
      </div>
    </div>
  );
}
