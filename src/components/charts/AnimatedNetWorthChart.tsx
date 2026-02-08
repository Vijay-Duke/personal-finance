/**
 * Animated Net Worth Chart
 *
 * Refined line chart with:
 * - Thin, elegant line stroke
 * - Subtle dots at data points
 * - Minimal grid and clean tooltip
 * - Theme-aware styling
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NetWorthDataPoint {
  date: string;
  value: number;
}

interface AnimatedNetWorthChartProps {
  data: NetWorthDataPoint[];
  className?: string;
  height?: number;
}

// Format currency
const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
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
function ChartTooltip({
  point,
  prevPoint,
  position,
}: {
  point: NetWorthDataPoint;
  prevPoint?: NetWorthDataPoint;
  position: { x: number; y: number };
}) {
  const change = prevPoint ? ((point.value - prevPoint.value) / prevPoint.value) * 100 : 0;
  const isPositive = change >= 0;

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
        <div className="text-xs text-text-secondary mb-1">{point.date}</div>
        <div className="text-lg font-bold text-text-primary mb-1">
          {formatCurrencyFull(point.value)}
        </div>
        {prevPoint && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-success' : 'text-danger'
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
            <span className="text-text-muted ml-1">vs prev</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AnimatedNetWorthChart({
  data,
  className,
  height = 280,
}: AnimatedNetWorthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });

  // Handle resize
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
        pathD: '',
        points: [],
        yTicks: [],
        xTicks: [],
        chartWidth: 0,
        chartHeight: 0,
        padding: { top: 20, right: 10, bottom: 32, left: 45 }
      };
    }

    const padding = { top: 20, right: 10, bottom: 32, left: 45 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const yMin = Math.max(0, minValue - range * 0.1);
    const yMax = maxValue + range * 0.1;

    // Scales
    const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
    const getY = (value: number) => padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

    // Generate smooth path using cubic bezier
    let pathD = `M ${getX(0)} ${getY(data[0].value)}`;

    for (let i = 0; i < data.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(data[i].value);
      const x1 = getX(i + 1);
      const y1 = getY(data[i + 1].value);

      const cp1x = x0 + (x1 - x0) * 0.5;
      const cp1y = y0;
      const cp2x = x1 - (x1 - x0) * 0.5;
      const cp2y = y1;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
    }

    const points = data.map((d, i) => ({
      x: getX(i),
      y: getY(d.value),
      data: d,
      index: i,
    }));

    // Y-axis ticks (fewer, cleaner)
    const yTicks = [0, 0.5, 1].map((t) => ({
      y: padding.top + chartHeight - t * chartHeight,
      value: yMin + t * (yMax - yMin),
    }));

    // X-axis ticks (show every other label if many points)
    const xTicks = data.map((d, i) => ({
      x: getX(i),
      label: d.date,
      showLabel: data.length <= 8 || i % 2 === 0,
    }));

    return {
      pathD,
      points,
      yTicks,
      xTicks,
      chartWidth,
      chartHeight,
      padding,
    };
  }, [data, dimensions]);

  const { pathD, points, yTicks, xTicks, chartWidth, padding } = chartData;

  const hoveredPoint = hoveredIndex !== null ? points?.[hoveredIndex] : null;

  // Calculate overall trend
  const trend = data.length >= 2
    ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100
    : 0;
  const isPositiveTrend = trend >= 0;

  return (
    <div ref={containerRef} className={cn('w-full relative', className)} style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        {/* Y-axis grid lines - very subtle */}
        {yTicks?.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding?.left}
              y1={tick.y}
              x2={(padding?.left || 0) + (chartWidth || 0)}
              y2={tick.y}
              stroke="currentColor"
              strokeDasharray="2 4"
              className="text-border/30"
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

        {/* Line path - thin and elegant */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="var(--color-primary-500)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Data points - subtle, visible only on hover or at key points */}
        {points.map((point, i) => (
          <g
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-pointer"
          >
            {/* Invisible hit area for easier hovering */}
            <circle
              cx={point.x}
              cy={point.y}
              r={15}
              fill="transparent"
            />

            {/* Visible dot - always visible but subtle */}
            <motion.circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === i ? 5 : 3}
              fill={hoveredIndex === i ? 'var(--color-primary-500)' : 'var(--color-card-bg)'}
              stroke="var(--color-primary-500)"
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: hoveredIndex === i ? 1 : 1,
                opacity: hoveredIndex === i ? 1 : 0.6,
              }}
              transition={{ delay: 0.6 + i * 0.04, type: 'spring', stiffness: 300 }}
            />

            {/* Subtle ring on hover */}
            {hoveredIndex === i && (
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={8}
                fill="none"
                stroke="var(--color-primary-500)"
                strokeWidth={1}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </g>
        ))}

        {/* X-axis labels */}
        {xTicks?.map((tick, i) => (
          tick.showLabel && (
            <text
              key={i}
              x={tick.x}
              y={dimensions.height - 10}
              textAnchor="middle"
              className={cn(
                'text-xs transition-all duration-200',
                hoveredIndex === i ? 'fill-text-primary font-medium' : 'fill-text-muted'
              )}
            >
              {tick.label}
            </text>
          )
        ))}
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredPoint && (
          <ChartTooltip
            point={hoveredPoint.data}
            prevPoint={hoveredPoint.index > 0 ? data[hoveredPoint.index - 1] : undefined}
            position={{ x: hoveredPoint.x, y: hoveredPoint.y - 12 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sample data generator
export function generateNetWorthData(months: number = 12): NetWorthDataPoint[] {
  const data: NetWorthDataPoint[] = [];
  const now = new Date();
  let baseValue = 50000;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Add some random variation with an upward trend
    baseValue = baseValue * (1 + (Math.random() * 0.08 - 0.02));
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: Math.round(baseValue),
    });
  }

  return data;
}
