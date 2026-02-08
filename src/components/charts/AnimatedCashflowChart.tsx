/**
 * Clean Cashflow Chart
 *
 * Minimal bar chart showing income vs expenses
 * Side-by-side bars with subtle, elegant styling
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CashflowDataPoint {
  month: string;
  income: number;
  expenses: number;
}

interface AnimatedCashflowChartProps {
  data: CashflowDataPoint[];
  className?: string;
  height?: number;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount}`;
};

const formatCurrencyFull = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Tooltip Component
function CashflowTooltip({
  data,
  position,
}: {
  data: CashflowDataPoint;
  position: { x: number; y: number };
}) {
  const net = data.income - data.expenses;
  const isPositive = net >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.12 }}
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-bg-elevated border border-border rounded-xl px-4 py-3 shadow-lg min-w-[160px]">
        <div className="text-xs text-text-muted mb-2">{data.month}</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Income</span>
            <span className="text-sm font-medium text-success">{formatCurrencyFull(data.income)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Expenses</span>
            <span className="text-sm font-medium text-warning">{formatCurrencyFull(data.expenses)}</span>
          </div>
          <div className="border-t border-border pt-1.5 flex items-center justify-between">
            <span className="text-xs text-text-secondary">Net</span>
            <span className={cn(
              'text-sm font-semibold',
              isPositive ? 'text-success' : 'text-danger'
            )}>
              {isPositive ? '+' : ''}{formatCurrencyFull(net)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AnimatedCashflowChart({
  data,
  className,
  height = 280,
}: AnimatedCashflowChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  const chartData = useMemo(() => {
    if (data.length === 0 || dimensions.width === 0) {
      return {
        bars: [],
        yTicks: [],
        maxValue: 0,
        padding: { top: 20, right: 20, bottom: 40, left: 50 },
      };
    }

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    const maxValue = Math.max(...data.flatMap(d => [d.income, d.expenses])) * 1.1;

    const barWidth = Math.min(24, (chartWidth / data.length) * 0.25);
    const gap = chartWidth / data.length;

    const bars = data.map((d, i) => {
      const x = padding.left + i * gap + gap / 2;
      const incomeHeight = (d.income / maxValue) * chartHeight;
      const expenseHeight = (d.expenses / maxValue) * chartHeight;

      return {
        x,
        yIncome: padding.top + chartHeight - incomeHeight,
        yExpense: padding.top + chartHeight - expenseHeight,
        incomeHeight,
        expenseHeight,
        data: d,
        index: i,
      };
    });

    // Y-axis ticks (5 ticks)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
      y: padding.top + chartHeight - t * chartHeight,
      value: t * maxValue,
    }));

    return { bars, yTicks, maxValue, padding, barWidth, chartHeight };
  }, [data, dimensions, height]);

  const { bars, yTicks, padding, barWidth, chartHeight } = chartData;
  const hoveredBar = hoveredIndex !== null ? bars[hoveredIndex] : null;

  // Calculate totals
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
  const totalNet = totalIncome - totalExpenses;

  return (
    <div className={cn('w-full', className)}>
      {/* Summary Stats - Minimal pills */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10">
          <TrendingUp className="w-3.5 h-3.5 text-success" />
          <span className="text-xs text-text-secondary">Income</span>
          <span className="text-sm font-medium text-success">{formatCurrencyFull(totalIncome)}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10">
          <TrendingDown className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs text-text-secondary">Expenses</span>
          <span className="text-sm font-medium text-warning">{formatCurrencyFull(totalExpenses)}</span>
        </div>

        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          totalNet >= 0 ? 'bg-success/10' : 'bg-danger/10'
        )}>
          <Wallet className={cn(
            'w-3.5 h-3.5',
            totalNet >= 0 ? 'text-success' : 'text-danger'
          )} />
          <span className="text-xs text-text-secondary">Net</span>
          <span className={cn(
            'text-sm font-medium',
            totalNet >= 0 ? 'text-success' : 'text-danger'
          )}>
            {formatCurrencyFull(Math.abs(totalNet))}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Y-axis grid lines - very subtle */}
          {yTicks?.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding?.left}
                y1={tick.y}
                x2={dimensions.width - (padding?.right || 0)}
                y2={tick.y}
                stroke="currentColor"
                strokeDasharray="2 4"
                className="text-border/30"
              />
              <text
                x={(padding?.left || 0) - 12}
                y={tick.y + 4}
                textAnchor="end"
                className="text-xs fill-text-muted"
              >
                {formatCurrency(tick.value)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {bars.map((bar, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Income bar - sage green */}
              <motion.rect
                x={bar.x - (barWidth || 12) - 2}
                y={bar.yIncome}
                width={barWidth || 12}
                height={bar.incomeHeight}
                rx={4}
                fill="var(--color-success)"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: 1,
                  opacity: hoveredIndex === i ? 1 : 0.85,
                }}
                transition={{
                  scaleY: { duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: `${bar.x - (barWidth || 12) / 2 - 2}px ${bar.yIncome + bar.incomeHeight}px` }}
              />

              {/* Expense bar - warm ochre/terracotta */}
              <motion.rect
                x={bar.x + 2}
                y={bar.yExpense}
                width={barWidth || 12}
                height={bar.expenseHeight}
                rx={4}
                fill="var(--color-warning)"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: 1,
                  opacity: hoveredIndex === i ? 1 : 0.85,
                }}
                transition={{
                  scaleY: { duration: 0.6, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.2 },
                }}
                style={{ transformOrigin: `${bar.x + 2 + (barWidth || 12) / 2}px ${bar.yExpense + bar.expenseHeight}px` }}
              />

              {/* Month label */}
              <text
                x={bar.x}
                y={(padding?.top || 0) + (chartHeight || 0) + 20}
                textAnchor="middle"
                className={cn(
                  'text-xs transition-all duration-200',
                  hoveredIndex === i ? 'fill-text-primary font-medium' : 'fill-text-muted'
                )}
              >
                {bar.data.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredBar && (
            <CashflowTooltip
              data={hoveredBar.data}
              position={{
                x: hoveredBar.x,
                y: Math.min(hoveredBar.yIncome, hoveredBar.yExpense) - 10,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-success)' }} />
          <span className="text-xs text-text-secondary">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-warning)' }} />
          <span className="text-xs text-text-secondary">Expenses</span>
        </div>
      </div>
    </div>
  );
}

// Sample data generator
export function generateCashflowData(months: number = 6): CashflowDataPoint[] {
  const data: CashflowDataPoint[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    data.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      income: Math.round(5000 + Math.random() * 2000),
      expenses: Math.round(3000 + Math.random() * 1500),
    });
  }

  return data;
}
