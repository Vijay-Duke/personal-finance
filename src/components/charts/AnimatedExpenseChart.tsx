/**
 * Animated Expense Chart
 *
 * Racing bar chart with:
 * - Staggered entrance animations
 * - Interactive hover states
 * - Color-coded categories
 * - Progress bars with animations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

interface AnimatedExpenseChartProps {
  data: ExpenseCategory[];
  className?: string;
  maxCategories?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function AnimatedExpenseChart({
  data,
  className,
  maxCategories = 6,
}: AnimatedExpenseChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort and limit data
  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, maxCategories);
  }, [data, maxCategories]);

  const maxValue = useMemo(() => {
    return Math.max(...sortedData.map((d) => d.value), 1);
  }, [sortedData]);

  const totalExpenses = useMemo(() => {
    return sortedData.reduce((sum, d) => sum + d.value, 0);
  }, [sortedData]);

  // Calculate if any category is significantly high (>40% of total)
  const significantCategories = useMemo(() => {
    return sortedData.filter((d) => (d.value / totalExpenses) > 0.4);
  }, [sortedData, totalExpenses]);

  return (
    <div className={cn('w-full', className)}>
      {/* Header with total */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-500/10">
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <span className="text-xs text-text-muted block">Total Expenses</span>
            <span className="text-lg font-bold text-text-primary">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>

        {significantCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>High spending in {significantCategories[0].name}</span>
          </motion.div>
        )}
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedData.map((category, index) => {
            const percentage = (category.value / maxValue) * 100;
            const percentOfTotal = (category.value / totalExpenses) * 100;
            const isHovered = hoveredIndex === index;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  'group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer',
                  isHovered
                    ? 'bg-bg-surface border-primary-500/30 shadow-lg shadow-primary-500/5'
                    : 'bg-card-bg border-border hover:border-border/80'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Rank number */}
                  <motion.div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors',
                      index < 3
                        ? 'bg-gradient-to-br text-white'
                        : 'bg-bg-elevated text-text-muted',
                      index === 0 && 'from-amber-400 to-amber-600',
                      index === 1 && 'from-slate-300 to-slate-500',
                      index === 2 && 'from-orange-400 to-orange-600'
                    )}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring' }}
                  >
                    {index + 1}
                  </motion.div>

                  {/* Category info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full transition-transform group-hover:scale-125"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className={cn(
                          'font-medium transition-colors',
                          isHovered ? 'text-text-primary' : 'text-text-secondary'
                        )}>
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-text-primary">
                          {formatCurrency(category.value)}
                        </span>
                        <span className="text-xs text-text-muted w-12 text-right">
                          {percentOfTotal.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${category.color}, ${category.color}88)`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          duration: 1,
                          delay: 0.3 + index * 0.1,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                      
                      {/* Shimmer effect on hover */}
                      {isHovered && (
                        <motion.div
                          className="absolute inset-y-0 w-20 bg-white/20"
                          initial={{ x: '-100%' }}
                          animate={{ x: '200%' }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded info on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-text-muted">
                            <span className="font-medium text-text-secondary">{formatCurrency(category.value)}</span> of{' '}
                            <span className="font-medium text-text-secondary">{formatCurrency(totalExpenses)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-rose-500">
                          <TrendingDown className="w-3 h-3" />
                          <span>{percentOfTotal.toFixed(1)}% of total</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer with insights */}
      {sortedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 pt-4 border-t border-border"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-text-muted">
              Top category: <span className="font-medium text-text-primary">{sortedData[0].name}</span>
              {' '}({((sortedData[0].value / totalExpenses) * 100).toFixed(1)}% of spending)
            </div>
            <div className="text-xs text-text-muted">
              {sortedData.length} categories tracked
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Sample data generator
export function generateExpenseData(): ExpenseCategory[] {
  return [
    { name: 'Housing', value: 2500, color: '#3b82f6' },
    { name: 'Food & Dining', value: 800, color: '#10b981' },
    { name: 'Transportation', value: 600, color: '#f59e0b' },
    { name: 'Entertainment', value: 400, color: '#8b5cf6' },
    { name: 'Shopping', value: 350, color: '#ec4899' },
    { name: 'Utilities', value: 300, color: '#06b6d4' },
    { name: 'Healthcare', value: 200, color: '#ef4444' },
    { name: 'Other', value: 150, color: '#6b7280' },
  ];
}
