/**
 * PilePeak.ai Inspired Dashboard - Consolidated Layout
 */

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Responsive } from 'react-grid-layout';
import { WidthProvider } from 'react-grid-layout/legacy';

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}
type Layouts = { [key: string]: LayoutItem[] };
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  BarChart3,
  ChevronRight,
  GripVertical,
  Target,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { AnimatedGoalProgress, type GoalData } from '../charts/AnimatedGoalProgress';
import { AnimatedNetWorthChart, generateNetWorthData } from '../charts/AnimatedNetWorthChart';
import { AnimatedCashflowChart, generateCashflowData } from '../charts/AnimatedCashflowChart';
import { AnimatedExpenseChart, generateExpenseData } from '../charts/AnimatedExpenseChart';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ResponsiveGridLayout = WidthProvider(Responsive) as any;

const DEFAULT_LAYOUT_VERSION = 2;
const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'evaluation', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'allocation', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'spending', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'cashflow', x: 6, y: 4, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'debt', x: 6, y: 7, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'netWorth', x: 0, y: 10, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'drawdown', x: 6, y: 10, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'assetGrowth', x: 0, y: 13, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'performance', x: 6, y: 13, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'goals', x: 0, y: 16, w: 12, h: 4, minW: 6, minH: 4 },
  ],
  md: [
    { i: 'evaluation', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'allocation', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'spending', x: 0, y: 4, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'cashflow', x: 6, y: 4, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'debt', x: 6, y: 7, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'netWorth', x: 0, y: 10, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'drawdown', x: 6, y: 10, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'assetGrowth', x: 0, y: 13, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'performance', x: 6, y: 13, w: 6, h: 3, minW: 4, minH: 2 },
    { i: 'goals', x: 0, y: 16, w: 12, h: 4, minW: 6, minH: 4 },
  ],
  sm: [
    { i: 'evaluation', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'allocation', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'spending', x: 0, y: 4, w: 12, h: 6, minW: 6, minH: 4 },
    { i: 'cashflow', x: 0, y: 10, w: 12, h: 3, minW: 6, minH: 2 },
    { i: 'debt', x: 0, y: 13, w: 12, h: 3, minW: 6, minH: 2 },
    { i: 'netWorth', x: 0, y: 16, w: 12, h: 3, minW: 6, minH: 2 },
    { i: 'drawdown', x: 0, y: 19, w: 12, h: 3, minW: 6, minH: 2 },
    { i: 'assetGrowth', x: 0, y: 22, w: 12, h: 3, minW: 6, minH: 2 },
    { i: 'performance', x: 0, y: 25, w: 12, h: 3, minW: 6, minH: 2 },
    { i: 'goals', x: 0, y: 28, w: 12, h: 4, minW: 6, minH: 4 },
  ],
  xs: [
    { i: 'evaluation', x: 0, y: 0, w: 4, h: 4, minW: 4, minH: 3 },
    { i: 'allocation', x: 0, y: 4, w: 4, h: 4, minW: 4, minH: 3 },
    { i: 'spending', x: 0, y: 8, w: 4, h: 6, minW: 4, minH: 4 },
    { i: 'cashflow', x: 0, y: 14, w: 4, h: 3, minW: 4, minH: 2 },
    { i: 'debt', x: 0, y: 17, w: 4, h: 3, minW: 4, minH: 2 },
    { i: 'netWorth', x: 0, y: 20, w: 4, h: 3, minW: 4, minH: 2 },
    { i: 'drawdown', x: 0, y: 23, w: 4, h: 3, minW: 4, minH: 2 },
    { i: 'assetGrowth', x: 0, y: 26, w: 4, h: 3, minW: 4, minH: 2 },
    { i: 'performance', x: 0, y: 29, w: 4, h: 3, minW: 4, minH: 2 },
    { i: 'goals', x: 0, y: 32, w: 4, h: 4, minW: 4, minH: 4 },
  ],
};

const ASSET_TYPES = [
  { type: 'bank_account', label: 'Cash & Bank', color: '#38bdf8', icon: '💵' },
  { type: 'stock', label: 'Stocks', color: '#818cf8', icon: '📈' },
  { type: 'crypto', label: 'Crypto', color: '#fbbf24', icon: '₿' },
  { type: 'real_estate', label: 'Real Estate', color: '#a78bfa', icon: '🏠' },
  { type: 'superannuation', label: 'Super', color: '#34d399', icon: '💰' },
  { type: 'personal_asset', label: 'Personal', color: '#fb7185', icon: '🚗' },
  { type: 'business_asset', label: 'Business', color: '#e879f9', icon: '🏢' },
  { type: 'debt', label: 'Debts', color: '#f87171', icon: '💳' },
];

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

// Sparkline Chart
function Sparkline({ data, color = '#10b981', height }: { data: number[]; color?: string; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const resolvedHeight = height ?? 140;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-hidden" style={{ height: resolvedHeight }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full block" style={{ overflow: 'hidden' }}>
        <defs>
          <filter id="sparkline-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.25"
          filter="url(#sparkline-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.25 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        />
      </svg>
    </div>
  );
}

function DualLineChart({
  data,
  height,
  colors = ['#10b981', '#60a5fa'],
  labels = ['Portfolio', 'Benchmark'],
}: {
  data: { primary: number; secondary: number }[];
  height?: number;
  colors?: [string, string];
  labels?: [string, string];
}) {
  const points = (series: 'primary' | 'secondary') =>
    data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const values = data.map((v) => v[series]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const y = 100 - ((d[series] - min) / range) * 70 - 15;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)] mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[0] }} />
          <span className="truncate max-w-[120px]">{labels[0]}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[1] }} />
          <span className="truncate max-w-[120px]">{labels[1]}</span>
        </div>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={height ? { height } : undefined}>
        <defs>
          <filter id="dual-line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.polyline
          points={points('secondary')}
          fill="none"
          stroke={colors[1]}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.2"
          filter="url(#dual-line-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.2 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.polyline
          points={points('secondary')}
          fill="none"
          stroke={colors[1]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        />
        <motion.polyline
          points={points('primary')}
          fill="none"
          stroke={colors[0]}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.22"
          filter="url(#dual-line-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.22 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        />
        <motion.polyline
          points={points('primary')}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </svg>
    </div>
  );
}

function StackedGrowthChart({
  series,
  height,
}: {
  series: { label: string; color: string; values: number[] }[];
  height?: number;
}) {
  const months = series[0]?.values.length || 0;
  const totals = Array.from({ length: months }, (_, i) =>
    series.reduce((sum, s) => sum + (s.values[i] || 0), 0)
  );
  const maxTotal = Math.max(...totals, 1);

  return (
    <div className="flex items-end gap-3" style={height ? { height } : undefined}>
      {totals.map((total, i) => (
        <div key={`stack-${i}`} className="flex-1 h-full flex items-end">
          <div className="w-full rounded-full bg-[var(--color-bg-surface)]/60 overflow-hidden flex flex-col justify-end">
            {series.map((s, idx) => {
              const h = total > 0 ? (s.values[i] / maxTotal) * 100 : 0;
              return (
                <motion.div
                  key={`${s.label}-${i}`}
                  className="w-full"
                  style={{ backgroundColor: s.color }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${h}%`, opacity: 0.9 }}
                  transition={{ duration: 0.9, delay: 0.05 * idx }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Mini Progress Bar
function MiniProgress({ value, total, color }: { value: number; total: number; color: string }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
      <div 
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: 'white' }}
      />
    </div>
  );
}

// Large Allocation Card with embedded chart
function LargeAllocationCard({ type, value, index, total }: { 
  type: typeof ASSET_TYPES[0]; 
  value: number; 
  index: number; 
  total: number;
}) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const hasValue = value > 0;
  const displayColor = type.type === 'debt' ? '#ef4444' : type.color;
  
  // Generate mini sparkline data based on value
  const miniSparkline = useMemo(() => {
    const base = value || 1000;
    return Array.from({ length: 20 }, (_, i) => 
      base * (1 + (Math.sin(i / 3) * 0.1) + (Math.random() - 0.5) * 0.05)
    );
  }, [value]);
  
  const glowId = `alloc-glow-${type.type}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'rounded-3xl p-5 text-white relative overflow-hidden border border-white/10 card-interactive',
        !hasValue && 'opacity-60'
      )}
      style={{ 
        background: `linear-gradient(145deg, ${displayColor} 0%, rgba(0,0,0,0.15) 100%)`
      }}
    >
      {/* Header */}
      <motion.div className="flex items-start justify-between mb-4" whileHover={{ y: -2 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
            {type.icon}
          </div>
          <div>
            <div className="font-semibold">{type.label}</div>
            <div className="text-xs text-white/70">
              {hasValue ? `${percent.toFixed(1)}% of portfolio` : 'No accounts'}
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Value */}
      <div className="text-2xl font-bold mb-3">{hasValue ? formatCurrency(value) : '$0'}</div>
      
      {/* Mini Sparkline */}
      {hasValue && (
        <motion.div className="mb-2" whileHover={{ opacity: 1 }}>
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8">
            <defs>
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <motion.polyline
              points={miniSparkline.map((v, i) => {
                const min = Math.min(...miniSparkline);
                const max = Math.max(...miniSparkline);
                const range = max - min || 1;
                const x = (i / (miniSparkline.length - 1)) * 100;
                const y = 30 - ((v - min) / range) * 20 - 5;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity="0.22"
              filter={`url(#${glowId})`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.22 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 + index * 0.05 }}
            />
            <motion.polyline
              points={miniSparkline.map((v, i) => {
                const min = Math.min(...miniSparkline);
                const max = Math.max(...miniSparkline);
                const range = max - min || 1;
                const x = (i / (miniSparkline.length - 1)) * 100;
                const y = 30 - ((v - min) / range) * 20 - 5;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity="0.7"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.25 + index * 0.05 }}
            />
          </svg>
        </motion.div>
      )}
      
      {/* Progress Bar */}
      <motion.div whileHover={{ scaleX: 1.02 }} className="origin-left">
        <MiniProgress value={value} total={total} color={type.color} />
      </motion.div>
    </motion.div>
  );
}

// Small Allocation Card
function SmallAllocationCard({ type, value, index, total }: { 
  type: typeof ASSET_TYPES[0]; 
  value: number; 
  index: number; 
  total: number;
}) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const hasValue = value > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      className={cn(
        'rounded-2xl p-4 border relative overflow-hidden card-interactive',
        hasValue 
          ? 'bg-[var(--color-card-bg)] border-[var(--color-border)]' 
          : 'bg-[var(--color-card-bg)]/50 border-[var(--color-border)]/50'
      )}
    >
      {/* Icon & Label */}
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: hasValue ? type.color : '#6b7280' }}
        >
          {type.icon}
        </div>
        <div className="font-medium text-[var(--color-text-primary)] text-sm truncate">{type.label}</div>
      </div>
      
      {/* Value */}
      <div className="text-lg font-bold text-[var(--color-text-primary)]">
        {hasValue ? formatCurrency(value) : '$0'}
      </div>
      
      {/* Percent & Mini Bar */}
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1 bg-[var(--color-bg-surface)] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all"
            style={{ 
              width: `${Math.min(percent, 100)}%`, 
              backgroundColor: hasValue ? type.color : '#6b7280' 
            }}
          />
        </div>
        <span className="text-xs text-[var(--color-text-muted)] w-10 text-right">{percent.toFixed(1)}%</span>
      </div>
    </motion.div>
  );
}

export function AnimatedDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const { data: summary, isLoading, error, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      return data;
    },
  });

  const { data: goalsData } = useQuery<GoalData[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('Failed');
      const goals = await res.json();
      return goals.map((g: any) => ({
        id: g.id,
        name: g.name,
        current: g.currentAmount,
        target: g.targetAmount,
        color: g.color || '#3b82f6',
        currency: g.currency || 'USD',
      }));
    },
    enabled: !isLoading && !!summary,
  });

  const netWorthTrend = summary?.change?.netWorth?.percent ?? 0;
  const isPositiveTrend = netWorthTrend >= 0;
  const trendValue = summary?.change?.netWorth?.value ?? 0;

  const sparklineData = useMemo(() => {
    const base = summary?.netWorth || 50000;
    return Array.from({ length: 30 }, (_, i) => 
      base * (1 + (Math.sin(i / 5) * 0.05) + (Math.random() - 0.5) * 0.02)
    );
  }, [summary?.netWorth]);

  const netWorthData = useMemo(() => generateNetWorthData(12), []);
  const cashflowData = useMemo(() => generateCashflowData(6), []);
  const expenseData = useMemo(() => generateExpenseData(), []);

  const totalAssets = summary?.totalAssets || 0;
  
  const assetValues = useMemo(() => {
    const values = new Map<string, number>();
    ASSET_TYPES.forEach(t => values.set(t.type, 0));
    summary?.breakdown?.forEach(b => {
      if (b.value > 0) {
        values.set(b.type, b.value);
      }
    });
    return values;
  }, [summary?.breakdown]);

  // Sort by value to find top 2
  const typeOrder = new Map(ASSET_TYPES.map((t, i) => [t.type, i]));
  const sortedTypes = [...ASSET_TYPES].sort((a, b) => {
    const diff = (assetValues.get(b.type) || 0) - (assetValues.get(a.type) || 0);
    if (diff !== 0) return diff;
    return (typeOrder.get(a.type) ?? 0) - (typeOrder.get(b.type) ?? 0);
  });
  
  const topTwo = sortedTypes.slice(0, 2);
  const rest = sortedTypes.slice(2);
  const topAssetTypes = sortedTypes.filter((t) => t.type !== 'debt').slice(0, 4);

  const assetGrowthSeries = useMemo(() => {
    const months = 6;
    return topAssetTypes.map((type, idx) => {
      const base = assetValues.get(type.type) || 0;
      const values = Array.from({ length: months }, (_, i) => {
        const trend = 0.85 + i * 0.05;
        return base * trend * (0.95 + (Math.sin(i + idx) * 0.03));
      });
      return { label: type.label, color: type.color, values };
    });
  }, [topAssetTypes, assetValues]);

  const debtTrend = useMemo(() => {
    const base = summary?.totalDebts || 12000;
    return Array.from({ length: 24 }, (_, i) => base * (1 - i * 0.02) * (0.96 + Math.sin(i / 3) * 0.02));
  }, [summary?.totalDebts]);

  const investmentComparison = useMemo(() => {
    const base = (summary?.investmentValue || 0) + (summary?.cryptoValue || 0) || 20000;
    return Array.from({ length: 12 }, (_, i) => {
      const portfolio = base * (1 + i * 0.018) * (0.98 + Math.sin(i / 3) * 0.02);
      const benchmark = base * (1 + i * 0.014) * (0.99 + Math.sin(i / 4) * 0.015);
      return { primary: portfolio, secondary: benchmark };
    });
  }, [summary?.investmentValue, summary?.cryptoValue]);

  const drawdownSeries = useMemo(() => {
    let peak = 0;
    return investmentComparison.map((p) => {
      peak = Math.max(peak, p.primary);
      const drawdown = peak > 0 ? ((p.primary - peak) / peak) * 100 : 0;
      return drawdown;
    });
  }, [investmentComparison]);

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [layouts, setLayouts] = useState<Layouts>(DEFAULT_LAYOUTS);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'lg' | 'md' | 'sm' | 'xs'>('lg');

  const { data: layoutData, isLoading: layoutLoading } = useQuery<{ layouts: Layouts | null; version?: number } | null>({
    queryKey: ['dashboard', 'layout'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/layout');
      if (!res.ok) throw new Error('Failed to fetch layout');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const [layoutReady, setLayoutReady] = useState(false);
  const layoutInitialized = useRef(false);

  const mergeLayouts = useCallback((saved: Layouts | null) => {
    if (!saved) return DEFAULT_LAYOUTS;
    const mergeFor = (bp: keyof Layouts) => {
      const base = DEFAULT_LAYOUTS[bp] || [];
      const next = saved[bp] || [];
      const map = new Map<string, LayoutItem>();
      base.forEach((item) => map.set(item.i, item));
      next.forEach((item) => {
        if (map.has(item.i)) {
          map.set(item.i, { ...map.get(item.i)!, ...item });
        }
      });
      return Array.from(map.values());
    };
    return {
      lg: mergeFor('lg'),
      md: mergeFor('md'),
      sm: mergeFor('sm'),
      xs: mergeFor('xs'),
    };
  }, []);

  const saveLayout = useCallback(async (nextLayouts: Layouts, version = DEFAULT_LAYOUT_VERSION) => {
    await fetch('/api/dashboard/layout', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layouts: nextLayouts, version }),
    });
  }, []);

  useEffect(() => {
    if (layoutInitialized.current) return;
    if (layoutLoading) return;
    const savedLayouts = layoutData?.layouts ?? null;
    const savedVersion = layoutData?.version ?? 1;
    if (savedLayouts && savedVersion >= DEFAULT_LAYOUT_VERSION) {
      setLayouts(mergeLayouts(savedLayouts));
    } else {
      setLayouts(DEFAULT_LAYOUTS);
      void saveLayout(DEFAULT_LAYOUTS, DEFAULT_LAYOUT_VERSION);
    }
    setLayoutReady(true);
    layoutInitialized.current = true;
  }, [layoutData, layoutLoading, mergeLayouts, saveLayout]);

  const persistLayout = useRef<number | null>(null);
  const handleLayoutChange = (_next: LayoutItem[], all: Layouts) => {
    if (!isCustomizing) return;
    setLayouts(all);
    if (persistLayout.current) {
      window.clearTimeout(persistLayout.current);
    }
    persistLayout.current = window.setTimeout(() => {
      saveLayout(all);
    }, 500);
  };

  const getItemHeight = useCallback((id: string, fallback = 220) => {
    const rowHeight = 80;
    const layout = layouts[currentBreakpoint]?.find((item) => item.i === id);
    if (!layout) return fallback;
    const raw = layout.h * rowHeight - 80;
    return Math.max(raw, 140);
  }, [layouts, currentBreakpoint]);

  const dashboardWidgets = useMemo(() => {
    const baseCard =
      'bg-[var(--color-card-bg)] rounded-3xl p-6 border border-[var(--color-border)] card-interactive h-full flex flex-col overflow-hidden';
    return {
      evaluation: (
        <div className={baseCard}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--color-text-muted)] mb-2">Total assets</div>
              <div className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-tight tabular-nums">
                {formatCurrency(summary?.netWorth || 0)}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                  isPositiveTrend ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                )}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{netWorthTrend.toFixed(1)}%</span>
                </div>
                <div className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-semibold',
                  isPositiveTrend ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                )}>
                  {formatCurrency(trendValue)}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                Strong performance
              </div>
            </div>
          </div>

          <div className="mt-6 flex-1 min-h-0 overflow-hidden">
            <Sparkline 
              data={sparklineData} 
              color={isPositiveTrend ? '#10b981' : '#ef4444'} 
              height={Math.max(getItemHeight('evaluation', 220) - 140, 120)}
            />
            <div className="flex justify-between mt-4 text-xs text-[var(--color-text-muted)]">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Total profit</div>
              <div className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                +{formatCurrency(summary?.totalAssets ? summary.totalAssets * 0.15 : 0)}
              </div>
              <div className="text-xs text-emerald-400">+15.81%</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Cash balance</div>
              <div className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(summary?.cashBalance || 0)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {totalAssets > 0 ? ((summary?.cashBalance || 0) / totalAssets * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Investments</div>
              <div className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency((summary?.investmentValue || 0) + (summary?.cryptoValue || 0))}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Stocks & Crypto</div>
            </div>
          </div>
        </div>
      ),
      allocation: (
        <div className={baseCard}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Allocation</h3>
            <div className="text-xs text-[var(--color-text-muted)]">By asset type</div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto pr-1">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {topTwo.map((type, index) => (
                  <LargeAllocationCard
                    key={type.type}
                    type={type}
                    value={assetValues.get(type.type) || 0}
                    index={index}
                    total={totalAssets}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {rest.map((type, index) => (
                  <SmallAllocationCard
                    key={type.type}
                    type={type}
                    value={assetValues.get(type.type) || 0}
                    index={index}
                    total={totalAssets}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      netWorth: (
        <div className={baseCard}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Net Worth Trend</h3>
            <span className="text-xs text-[var(--color-text-muted)]">Monthly</span>
          </div>
          <div className="flex-1 min-h-0">
            <AnimatedNetWorthChart data={netWorthData} height={getItemHeight('netWorth')} />
          </div>
        </div>
      ),
      cashflow: (
        <div className={baseCard}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Cashflow</h3>
            <span className="text-xs text-[var(--color-text-muted)]">Income vs Expenses</span>
          </div>
          <div className="flex-1 min-h-0">
            <AnimatedCashflowChart data={cashflowData} height={getItemHeight('cashflow')} />
          </div>
        </div>
      ),
      spending: (
        <div className={baseCard}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Spending by Category</h3>
            <span className="text-xs text-[var(--color-text-muted)]">Last 30 days</span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto pr-2">
            <AnimatedExpenseChart data={expenseData} maxCategories={5} />
          </div>
        </div>
      ),
      assetGrowth: (
        <div className={baseCard}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Asset Growth by Type</h3>
            <span className="text-xs text-[var(--color-text-muted)]">6 months</span>
          </div>
          <div className="w-full flex-1 min-h-0 overflow-hidden">
            <StackedGrowthChart series={assetGrowthSeries} height={getItemHeight('assetGrowth', 160)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
            {assetGrowthSeries.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      ),
      debt: (
        <div className={baseCard}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Debt Payoff Trend</h3>
            <span className="text-xs text-[var(--color-text-muted)]">24 months</span>
          </div>
          <div className="w-full flex-1 min-h-0 overflow-hidden">
            <Sparkline data={debtTrend} color="#ef4444" height={getItemHeight('debt', 160)} />
          </div>
          <div className="mt-3 text-xs text-[var(--color-text-muted)]">Lower is better</div>
        </div>
      ),
      performance: (
        <div className={baseCard}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight">
                Performance vs Benchmark
              </h3>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Portfolio comparison</div>
            </div>
            <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">12 months</span>
          </div>
          <div className="w-full flex-1 min-h-0 overflow-hidden">
            <DualLineChart data={investmentComparison} height={getItemHeight('performance', 200)} />
          </div>
        </div>
      ),
      drawdown: (
        <div className={baseCard}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight">Drawdown</h3>
            <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">12 months</span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mb-3">Max drawdown</div>
          <div className="w-full flex-1 min-h-0 overflow-hidden">
            <Sparkline data={drawdownSeries.map((d) => Math.abs(d))} color="#f59e0b" height={getItemHeight('drawdown', 200)} />
          </div>
        </div>
      ),
      goals: (
        <div className={baseCard}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Goals</h3>
            <span className="text-xs text-[var(--color-text-muted)]">Progress</span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto pr-2">
            {goalsData && goalsData.length > 0 ? (
              <AnimatedGoalProgress goals={goalsData} />
            ) : (
              <div className="rounded-2xl border border-[var(--color-border)] p-8 text-center">
                <Target className="w-10 h-10 mx-auto mb-2 text-[var(--color-text-muted)]" />
                <p className="text-[var(--color-text-muted)]">No goals set yet</p>
              </div>
            )}
          </div>
        </div>
      ),
    };
  }, [
    assetGrowthSeries,
    cashflowData,
    debtTrend,
    drawdownSeries,
    expenseData,
    investmentComparison,
    netWorthData,
    getItemHeight,
    goalsData,
    isPositiveTrend,
    netWorthTrend,
    sparklineData,
    totalAssets,
    trendValue,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--color-danger)] bg-[var(--color-danger-bg)] p-8 text-center">
        <p className="text-[var(--color-danger)] font-medium">Failed to load dashboard</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    );
  }

  const hasAccounts = summary && (summary.totalAssets > 0 || summary.totalDebts > 0);
  if (!hasAccounts) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Welcome</h1>
        <p className="text-[var(--color-text-muted)] mb-4">Add your first account to get started</p>
        <Button onClick={() => window.location.href = '/accounts/bank'}>Add Account</Button>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-10"
    >
      {/* Header */}
      <div className="px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--color-text-muted)]">Overview</div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-surface)]">
              Last 30 days
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Analytics */}
      <div className="px-4 md:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Widgets</h2>
            <button
              type="button"
              onClick={() => setIsCustomizing((v) => !v)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors',
                isCustomizing
                  ? 'border-primary-500/40 text-primary-500 bg-primary-500/10'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
              )}
            >
              {isCustomizing ? 'Done' : 'Customize'}
            </button>
            {isCustomizing && (
              <button
                type="button"
                onClick={async () => {
                  setLayouts(DEFAULT_LAYOUTS);
                  await saveLayout(DEFAULT_LAYOUTS);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]"
              >
                Reset
              </button>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {Object.keys(dashboardWidgets).length} widgets
          </div>
        </div>

        <div className={cn(isCustomizing && 'select-none')}>
          {layoutReady ? (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 900, sm: 600, xs: 0 }}
              cols={{ lg: 12, md: 12, sm: 12, xs: 4 }}
              rowHeight={80}
              margin={[24, 24]}
              isDraggable={isCustomizing}
              isResizable={isCustomizing}
              compactType={null}
              preventCollision
              isBounded
              autoSize
              measureBeforeMount
              useCSSTransforms={false}
              onLayoutChange={handleLayoutChange}
              onBreakpointChange={(bp: string) => setCurrentBreakpoint(bp as 'lg' | 'md' | 'sm' | 'xs')}
              draggableHandle=".drag-handle"
            >
              {Object.entries(dashboardWidgets).map(([id, widget]) => (
                <div key={id} className="h-full relative">
                  {isCustomizing && (
                    <div className="drag-handle absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card-bg)]/90 px-2 py-1 text-[10px] text-[var(--color-text-muted)] cursor-grab">
                      <GripVertical className="w-3 h-3" />
                      Drag
                    </div>
                  )}
                  {widget}
                </div>
              ))}
            </ResponsiveGridLayout>
          ) : (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 text-sm text-[var(--color-text-muted)]">
              Loading layout…
            </div>
          )}
        </div>

      </div>

      {/* Goals now part of widget grid */}
    </motion.div>
  );
}
