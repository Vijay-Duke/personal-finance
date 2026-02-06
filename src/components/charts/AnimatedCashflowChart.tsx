/**
 * Animated Cashflow Stream Chart
 *
 * Beautiful area chart showing income vs expenses as flowing streams
 * with the gap between them representing net cashflow
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
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-bg-elevated/95 backdrop-blur-md border border-border/50 rounded-xl px-4 py-3 shadow-xl min-w-[180px]">
        <div className="text-xs text-text-muted mb-3">{data.month}</div>
        
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Income</span>
            <span className="text-sm font-semibold text-emerald-500">{formatCurrencyFull(data.income)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Expenses</span>
            <span className="text-sm font-semibold text-rose-500">{formatCurrencyFull(data.expenses)}</span>
          </div>
          
          <div className="border-t border-border/50 pt-2 flex items-center justify-between">
            <span className="text-xs text-text-muted">Net</span>
            <span className={cn(
              'text-sm font-bold',
              isPositive ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {isPositive ? '+' : '-'}{formatCurrencyFull(Math.abs(net))}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-bg-elevated/95 border-r border-b border-border/50 transform rotate-45" />
    </motion.div>
  );
}

export function AnimatedCashflowChart({
  data,
  className,
  height = 320,
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
        paths: { income: '', expense: '', netPositive: '', netNegative: '' },
        points: [],
        padding: { top: 40, right: 10, bottom: 50, left: 35 },
        yTicks: [],
      };
    }

    const padding = { top: 40, right: 10, bottom: 50, left: 35 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    const values = data.flatMap(d => [d.income, d.expenses]);
    const maxValue = Math.max(...values) * 1.1;

    const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
    const getY = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

    // Generate smooth paths
    const generatePath = (values: number[]) => {
      let path = `M ${getX(0)} ${getY(values[0])}`;
      for (let i = 0; i < values.length - 1; i++) {
        const x0 = getX(i);
        const y0 = getY(values[i]);
        const x1 = getX(i + 1);
        const y1 = getY(values[i + 1]);
        const cp1x = x0 + (x1 - x0) * 0.5;
        const cp2x = x1 - (x1 - x0) * 0.5;
        path += ` C ${cp1x} ${y0}, ${cp2x} ${y1}, ${x1} ${y1}`;
      }
      return path;
    };

    const incomePath = generatePath(data.map(d => d.income));
    const expensePath = generatePath(data.map(d => d.expenses));

    // Close paths for areas
    const incomeArea = `${incomePath} L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;
    const expenseArea = `${expensePath} L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

    // Net flow area (between income and expense)
    let netPath = '';
    data.forEach((d, i) => {
      const x = getX(i);
      const yIncome = getY(d.income);
      const yExpense = getY(d.expenses);
      if (i === 0) {
        netPath = `M ${x} ${yIncome}`;
      } else {
        const prevX = getX(i - 1);
        const prevIncome = getY(data[i - 1].income);
        const cp1x = prevX + (x - prevX) * 0.5;
        const cp2x = x - (x - prevX) * 0.5;
        netPath += ` C ${cp1x} ${prevIncome}, ${cp2x} ${yIncome}, ${x} ${yIncome}`;
      }
    });
    
    // Close the net area by going down to expense line and back
    for (let i = data.length - 1; i >= 0; i--) {
      const x = getX(i);
      const yExpense = getY(data[i].expenses);
      if (i === data.length - 1) {
        netPath += ` L ${x} ${yExpense}`;
      } else {
        const nextX = getX(i + 1);
        const nextExpense = getY(data[i + 1].expenses);
        const cp1x = nextX - (nextX - x) * 0.5;
        const cp2x = x + (nextX - x) * 0.5;
        netPath += ` C ${cp1x} ${nextExpense}, ${cp2x} ${yExpense}, ${x} ${yExpense}`;
      }
    }
    netPath += ' Z';

    const points = data.map((d, i) => ({
      x: getX(i),
      yIncome: getY(d.income),
      yExpense: getY(d.expenses),
      data: d,
      index: i,
    }));

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: padding.top + chartHeight - t * chartHeight,
      value: t * maxValue,
    }));

    return {
      paths: {
        income: incomePath,
        expense: expensePath,
        incomeArea,
        expenseArea,
        netArea: netPath,
      },
      points,
      padding,
      yTicks,
      chartHeight,
    };
  }, [data, dimensions, height]);

  const { paths, points, padding, yTicks } = chartData;
  const hoveredPoint = hoveredIndex !== null ? points?.[hoveredIndex] : null;

  // Calculate totals
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
  const totalNet = totalIncome - totalExpenses;

  return (
    <div className={cn('w-full', className)}>
      {/* Summary Stats */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <div>
            <span className="text-xs text-text-muted block">Income</span>
            <span className="text-sm font-semibold text-emerald-500">{formatCurrencyFull(totalIncome)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10">
          <TrendingDown className="w-4 h-4 text-rose-500" />
          <div>
            <span className="text-xs text-text-muted block">Expenses</span>
            <span className="text-sm font-semibold text-rose-500">{formatCurrencyFull(totalExpenses)}</span>
          </div>
        </div>

        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl',
          totalNet >= 0 ? 'bg-primary-500/10' : 'bg-rose-500/10'
        )}>
          <Wallet className={cn(
            'w-4 h-4',
            totalNet >= 0 ? 'text-primary-500' : 'text-rose-500'
          )} />
          <div>
            <span className="text-xs text-text-muted block">Net</span>
            <span className={cn(
              'text-sm font-semibold',
              totalNet >= 0 ? 'text-primary-500' : 'text-rose-500'
            )}>
              {formatCurrencyFull(Math.abs(totalNet))}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            {/* Income gradient */}
            <linearGradient id="incomeGradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
            
            {/* Expense gradient */}
            <linearGradient id="expenseGradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
            </linearGradient>

            {/* Net positive gradient */}
            <linearGradient id="netPositiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks?.map((tick: { y: number; value: number }, i: number) => (
            <g key={i}>
              <line
                x1={padding?.left}
                y1={tick.y}
                x2={dimensions.width - (padding?.right || 0)}
                y2={tick.y}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-border/40"
              />
              <text
                x={(padding?.left || 0) - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="text-xs fill-text-muted"
              >
                {formatCurrency(tick.value)}
              </text>
            </g>
          ))}

          {/* Expense area (bottom layer) */}
          <motion.path
            d={paths.expenseArea}
            fill="url(#expenseGradientArea)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Net flow area (between income and expense) */}
          <motion.path
            d={paths.netArea}
            fill="url(#netPositiveGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />

          {/* Expense line */}
          <motion.path
            d={paths.expense}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Income line */}
          <motion.path
            d={paths.income}
            fill="none"
            stroke="#10b981"
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          />

          {/* Data points and month labels */}
          {points.map((point, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Income point */}
              <motion.circle
                cx={point.x}
                cy={point.yIncome}
                r={hoveredIndex === i ? 6 : 4}
                fill="var(--color-card-bg)"
                stroke="#10b981"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: hoveredIndex === i ? 1.3 : 1 }}
                transition={{ delay: 0.8 + i * 0.05, type: 'spring' }}
              />

              {/* Expense point */}
              <motion.circle
                cx={point.x}
                cy={point.yExpense}
                r={hoveredIndex === i ? 5 : 3}
                fill="var(--color-card-bg)"
                stroke="#ef4444"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: hoveredIndex === i ? 1.3 : 1 }}
                transition={{ delay: 0.85 + i * 0.05, type: 'spring' }}
              />

              {/* Month label */}
              <text
                x={point.x}
                y={(padding?.top || 0) + (chartData.chartHeight || 0) + 25}
                textAnchor="middle"
                className={cn(
                  'text-sm font-medium transition-all duration-200',
                  hoveredIndex === i ? 'fill-text-primary' : 'fill-text-muted'
                )}
              >
                {point.data.month}
              </text>

              {/* Hit area */}
              <rect
                x={point.x - 30}
                y={padding?.top}
                width={60}
                height={chartData.chartHeight}
                fill="transparent"
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredPoint && (
            <CashflowTooltip
              data={hoveredPoint.data}
              position={{ 
                x: hoveredPoint.x, 
                y: Math.min(hoveredPoint.yIncome, hoveredPoint.yExpense) - 15 
              }}
            />
          )}
        </AnimatePresence>
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
