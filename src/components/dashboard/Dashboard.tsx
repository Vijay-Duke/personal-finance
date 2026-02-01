import { StatCard } from './StatCard';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Building2,
  Clock,
  PiggyBank,
} from 'lucide-react';

// Placeholder data - will be replaced with real data from API
const stats = [
  {
    title: 'Net Worth',
    value: '$0.00',
    change: { value: '0%', trend: 'neutral' as const },
    icon: Wallet,
    iconColor: 'bg-primary-100 text-primary-600',
  },
  {
    title: 'Total Assets',
    value: '$0.00',
    change: { value: '0%', trend: 'neutral' as const },
    icon: TrendingUp,
    iconColor: 'bg-success/10 text-success',
  },
  {
    title: 'Total Debts',
    value: '$0.00',
    change: { value: '0%', trend: 'neutral' as const },
    icon: CreditCard,
    iconColor: 'bg-danger/10 text-danger',
  },
  {
    title: 'Real Estate Equity',
    value: '$0.00',
    change: { value: '0%', trend: 'neutral' as const },
    icon: Building2,
    iconColor: 'bg-info/10 text-info',
  },
  {
    title: 'Runway',
    value: '-- months',
    icon: Clock,
    iconColor: 'bg-warning/10 text-warning',
  },
  {
    title: 'Monthly Savings Required',
    value: '$0.00',
    icon: PiggyBank,
    iconColor: 'bg-primary-100 text-primary-600',
  },
];

export function Dashboard() {
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
          <div className="flex h-48 items-center justify-center text-text-muted">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <p className="mt-2">Add accounts to see allocation</p>
            </div>
          </div>
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

      {/* Goals Progress */}
      <div className="rounded-xl border border-border bg-card-bg p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Goals Progress</h2>
          <a href="/goals" className="text-sm text-primary-600 hover:text-primary-700">
            Manage goals
          </a>
        </div>
        <div className="flex h-32 items-center justify-center text-text-muted">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="mt-2">Set up your financial goals</p>
            <a href="/goals" className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700">
              Create a goal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
