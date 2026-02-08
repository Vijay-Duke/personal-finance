/**
 * Zen Finance Dashboard — "Your Financial Flow"
 * Single-column, scroll-based, calm reading experience.
 */

import { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowUpRight, ArrowDownRight, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { CircularProgress } from '../ui/CircularProgress';
import { SectionHeader } from '../ui/SectionHeader';
import { PageHeader } from '../ui/PageHeader';
import { InsightQuote } from '../ui/InsightQuote';
import { PageFooter } from '../ui/PageFooter';
import { AnimatedNetWorthChart, generateNetWorthData } from '../charts/AnimatedNetWorthChart';
import { AnimatedCashflowChart, generateCashflowData } from '../charts/AnimatedCashflowChart';

interface DashboardSummary {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  cashBalance: number;
  investmentValue: number;
  cryptoValue: number;
  breakdown: { type: string; label: string; value: number; count: number }[];
  change: {
    netWorth: { value: number; percent: number };
    assets: { value: number; percent: number };
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

const ALLOCATION_COLORS: Record<string, string> = {
  bank_account: 'var(--color-primary-400)',
  stock: '#818cf8',
  crypto: '#d4a574',
  real_estate: '#a78bfa',
  superannuation: 'var(--color-primary-500)',
  personal_asset: '#c4956a',
  business_asset: '#8b9dc3',
  debt: 'var(--color-danger)',
};

const ALLOCATION_LABELS: Record<string, string> = {
  bank_account: 'Cash & Bank',
  stock: 'Stocks & ETFs',
  crypto: 'Crypto',
  real_estate: 'Real Estate',
  superannuation: 'Superannuation',
  personal_asset: 'Personal Assets',
  business_asset: 'Business Assets',
  debt: 'Debts',
};

const gentle: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function AllocationRow({
  type,
  value,
  total,
  index,
}: {
  type: string;
  value: number;
  total: number;
  index: number;
}) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const color = ALLOCATION_COLORS[type] || 'var(--color-text-muted)';
  const label = ALLOCATION_LABELS[type] || type;

  return (
    <motion.div
      custom={index}
      variants={gentle}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="flex items-center gap-4 py-3"
    >
      <div
        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="flex-1 text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary tabular-nums">
        {formatCurrency(value)}
      </span>
      <span className="w-12 text-right text-xs text-text-muted tabular-nums">
        {percent.toFixed(1)}%
      </span>
    </motion.div>
  );
}

function MonthlyPulseCard({
  label,
  value,
  change,
  index,
}: {
  label: string;
  value: number;
  change?: number;
  index: number;
}) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      custom={index}
      variants={gentle}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="rounded-[var(--radius-xl)] border border-border bg-card-bg p-6"
    >
      <div className="text-xs font-medium uppercase tracking-[0.15em] text-text-muted mb-3">
        {label}
      </div>
      <div className="text-xl font-medium text-text-primary tabular-nums" style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>
        {formatCurrency(value)}
      </div>
      {change !== undefined && (
        <div className={cn(
          'mt-2 flex items-center gap-1 text-xs',
          isPositive ? 'text-success' : 'text-danger'
        )}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}
    </motion.div>
  );
}

export function AnimatedDashboard() {
  const { data: summary, isLoading, error, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      return data;
    },
  });

  const netWorthTrend = summary?.change?.netWorth?.percent ?? 0;
  const isPositiveTrend = netWorthTrend >= 0;

  const netWorthData = useMemo(() => generateNetWorthData(12), []);
  const cashflowData = useMemo(() => generateCashflowData(6), []);

  const totalAssets = summary?.totalAssets || 0;

  // Sort allocations by value (descending), exclude zero values
  const allocations = useMemo(() => {
    if (!summary?.breakdown) return [];
    return [...summary.breakdown]
      .filter((b) => b.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [summary?.breakdown]);

  // Net worth as a percentage for the ring (cap at 100%)
  const netWorthRingValue = useMemo(() => {
    if (!summary) return 0;
    const { totalAssets: a, totalDebts: d } = summary;
    if (a === 0) return 0;
    return Math.min(((a - d) / a) * 100, 100);
  }, [summary]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Hero skeleton */}
        <div className="h-32 rounded-[var(--radius-xl)] animate-[shimmer_1.8s_ease-in-out_infinite]"
          style={{ background: 'linear-gradient(90deg, var(--color-skeleton-bg) 25%, var(--color-skeleton-shine) 50%, var(--color-skeleton-bg) 75%)', backgroundSize: '200% 100%' }}
        />
        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-[var(--radius-xl)] animate-[shimmer_1.8s_ease-in-out_infinite]"
              style={{ background: 'linear-gradient(90deg, var(--color-skeleton-bg) 25%, var(--color-skeleton-shine) 50%, var(--color-skeleton-bg) 75%)', backgroundSize: '200% 100%' }}
            />
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-64 rounded-[var(--radius-xl)] animate-[shimmer_1.8s_ease-in-out_infinite]"
              style={{ background: 'linear-gradient(90deg, var(--color-skeleton-bg) 25%, var(--color-skeleton-shine) 50%, var(--color-skeleton-bg) 75%)', backgroundSize: '200% 100%' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-danger/30 bg-danger/5 p-8 text-center">
        <p className="text-danger text-sm mb-4">Unable to load your financial data</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const hasAccounts = summary && (summary.totalAssets > 0 || summary.totalDebts > 0);
  if (!hasAccounts) {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border">
          <Leaf className="h-7 w-7 text-primary-400" />
        </div>
        <h1 className="page-title">Begin Your Journey</h1>
        <p className="mt-3 max-w-sm text-sm text-text-secondary leading-relaxed">
          Add your first account to start understanding your financial flow.
        </p>
        <Button className="mt-8" onClick={() => window.location.href = '/accounts/bank'}>
          Add Your First Account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <PageHeader
        label="THE MINDFUL INVESTOR"
        title="Your Financial Flow"
        status={
          isPositiveTrend
            ? { text: 'Growing steadily', variant: 'success' }
            : { text: 'Needs attention', variant: 'warning' }
        }
      >
        {/* Net Worth Ring */}
        <div className="flex flex-col items-center">
          <CircularProgress
            value={netWorthRingValue}
            size="hero"
            strokeWidth={3}
            fillColor="var(--color-primary-500)"
            trackColor="var(--color-border)"
            animated
          >
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-text-muted">Net Worth</span>
              <span className="hero-number mt-1">{formatCurrency(summary?.netWorth || 0)}</span>
              <div className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                isPositiveTrend ? 'text-success' : 'text-danger'
              )}>
                {isPositiveTrend ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{netWorthTrend.toFixed(1)}% this month</span>
              </div>
            </div>
          </CircularProgress>
        </div>
      </PageHeader>

      {/* Monthly Pulse */}
      <section>
        <SectionHeader title="Monthly Pulse" meta="Last 30 days" />
        <div className="mt-6 grid grid-cols-2 gap-5">
          <MonthlyPulseCard
            label="Total Assets"
            value={summary?.totalAssets || 0}
            change={summary?.change?.assets?.percent}
            index={0}
          />
          <MonthlyPulseCard
            label="Total Debts"
            value={summary?.totalDebts || 0}
            index={1}
          />
          <MonthlyPulseCard
            label="Cash Balance"
            value={summary?.cashBalance || 0}
            index={2}
          />
          <MonthlyPulseCard
            label="Investments"
            value={(summary?.investmentValue || 0) + (summary?.cryptoValue || 0)}
            index={3}
          />
        </div>
      </section>

      {/* Net Worth Trend */}
      <section>
        <SectionHeader title="Mindful Growth" meta="12 months" />
        <div className="mt-6 rounded-[var(--radius-xl)] border border-border bg-card-bg p-6">
          <AnimatedNetWorthChart data={netWorthData} height={200} />
        </div>
      </section>

      {/* Cashflow */}
      <section>
        <SectionHeader title="Income & Outflow" meta="6 months" />
        <div className="mt-6 rounded-[var(--radius-xl)] border border-border bg-card-bg p-6">
          <AnimatedCashflowChart data={cashflowData} height={180} />
        </div>
      </section>

      {/* Allocation Architecture */}
      {allocations.length > 0 && (
        <section>
          <SectionHeader title="Allocation Architecture" divider />
          <div className="mt-4 divide-y divide-border">
            {allocations.map((item, index) => (
              <AllocationRow
                key={item.type}
                type={item.type}
                value={item.value}
                total={totalAssets}
                index={index}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mindful Note */}
      <InsightQuote
        label="MINDFUL NOTE"
        quote="Wealth is not about having a lot of money; it's about having a lot of options."
      />

      {/* Footer */}
      <PageFooter
        icon={<Leaf className="h-5 w-5" />}
        label="YOUR JOURNEY"
        userName={undefined}
      />
    </div>
  );
}
