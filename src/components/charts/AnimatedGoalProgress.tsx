/**
 * Animated Goal Progress Component
 *
 * Interactive, animated goal progress visualization with:
 * - Circular progress rings with smooth animations
 * - Hover interactions showing detailed info
 * - Staggered entrance animations
 * - Color-coded progress states
 * - Responsive grid layout
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface GoalData {
  id?: string;
  name: string;
  current: number;
  target: number;
  color?: string;
  currency?: string;
  deadline?: string;
  description?: string;
}

interface AnimatedGoalProgressProps {
  goals: GoalData[];
  className?: string;
}

interface GoalCardProps {
  goal: GoalData;
  index: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}

// Color mapping for default colors
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const getColor = (index: number, customColor?: string) => {
  return customColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
};

// Format currency with compact notation
const formatCurrency = (amount: number, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: amount >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  });
  return formatter.format(amount);
};

// Format full currency for tooltips
const formatCurrencyFull = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate days remaining
const getDaysRemaining = (deadline?: string) => {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days;
};

// Circular Progress Ring Component
function CircularProgress({
  percentage,
  color,
  size = 120,
  strokeWidth = 10,
  children,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const glowId = `goal-glow-${color.replace('#', '')}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/50"
        />
        {/* Progress ring with gradient */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${color.replace('#', '')})`}
          strokeWidth={strokeWidth + 3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          filter={`url(#${glowId})`}
          opacity={0.2}
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={{ strokeDashoffset, opacity: 0.2 }}
          transition={{
            duration: 1.6,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.15,
          }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${color.replace('#', '')})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.2,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Individual Goal Card Component
function GoalCard({ goal, index, isHovered, onHover }: GoalCardProps) {
  const color = getColor(index, goal.color);
  const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const isComplete = percentage >= 100;
  const daysRemaining = getDaysRemaining(goal.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      onMouseEnter={() => onHover(goal.id || String(index))}
      onMouseLeave={() => onHover(null)}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 transition-all duration-300',
        'bg-card-bg hover:bg-card-bg-hover card-interactive',
        isHovered ? 'border-primary-500/30 shadow-lg shadow-primary-500/5' : 'border-border'
      )}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        animate={{ opacity: isHovered ? 0.05 : 0 }}
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)`,
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Circular Progress */}
        <div className="relative mb-4">
          <CircularProgress percentage={percentage} color={color} size={140} strokeWidth={12}>
            <div className="flex flex-col items-center">
              <motion.span
                className="text-2xl font-bold"
                style={{ color }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
              >
                {percentage}%
              </motion.span>
              <span className="text-xs text-text-muted">Complete</span>
            </div>
          </CircularProgress>

          {/* Completion badge */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Goal Info */}
        <motion.h3
          className="font-semibold text-text-primary mb-1 line-clamp-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
        >
          {goal.name}
        </motion.h3>

        {/* Amount display with animation */}
        <motion.div
          className="flex items-center gap-1 text-sm text-text-secondary mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + index * 0.1 }}
        >
          <span className="font-medium" style={{ color }}>
            {formatCurrency(goal.current, goal.currency)}
          </span>
          <span className="text-text-muted">/</span>
          <span className="text-text-muted">{formatCurrency(goal.target, goal.currency)}</span>
        </motion.div>

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
              {/* Remaining amount */}
              <div className="flex items-center justify-center gap-2 text-xs text-text-muted mb-2">
                <Target className="w-3.5 h-3.5" />
                <span>
                  {isComplete
                    ? 'Goal achieved! 🎉'
                    : `${formatCurrencyFull(goal.target - goal.current, goal.currency)} remaining`}
                </span>
              </div>

              {/* Days remaining if deadline exists */}
              {daysRemaining !== null && (
                <div
                  className={cn(
                    'flex items-center justify-center gap-1.5 text-xs px-2 py-1 rounded-full w-fit mx-auto',
                    daysRemaining < 0
                      ? 'bg-danger/10 text-danger'
                      : daysRemaining < 30
                        ? 'bg-warning/10 text-warning'
                        : 'bg-success/10 text-success'
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  <span>
                    {daysRemaining < 0
                      ? `${Math.abs(daysRemaining)} days overdue`
                      : daysRemaining === 0
                        ? 'Due today'
                        : `${daysRemaining} days left`}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar at bottom */}
        <div className="w-full mt-4">
          <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}66` }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                duration: 1.2,
                delay: 0.3 + index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Summary Stats Component
function GoalSummary({ goals }: { goals: GoalData[] }) {
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.current >= g.target).length;
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.current, 0);
  const overallProgress = Math.round((totalCurrent / totalTarget) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-border"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10">
        <Target className="w-4 h-4 text-primary-500" />
        <span className="text-sm">
          <span className="font-semibold text-text-primary">{totalGoals}</span>{' '}
          <span className="text-text-muted">goals</span>
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10">
        <CheckCircle2 className="w-4 h-4 text-success" />
        <span className="text-sm">
          <span className="font-semibold text-text-primary">{completedGoals}</span>{' '}
          <span className="text-text-muted">completed</span>
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-info/10">
        <TrendingUp className="w-4 h-4 text-info" />
        <span className="text-sm">
          <span className="font-semibold text-text-primary">{overallProgress}%</span>{' '}
          <span className="text-text-muted">overall progress</span>
        </span>
      </div>
    </motion.div>
  );
}

// Main Component
export function AnimatedGoalProgress({ goals, className }: AnimatedGoalProgressProps) {
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);

  if (goals.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center h-[200px] text-text-muted',
          className
        )}
      >
        <Target className="w-12 h-12 mb-3 opacity-50" />
        <p>No goals set yet</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {goals.map((goal, index) => (
          <GoalCard
            key={goal.id || index}
            goal={goal}
            index={index}
            isHovered={hoveredGoal === (goal.id || String(index))}
            onHover={setHoveredGoal}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <GoalSummary goals={goals} />
    </div>
  );
}

// Sample data generator for demo
export function generateGoalData(): GoalData[] {
  return [
    {
      id: '1',
      name: 'Emergency Fund',
      current: 15000,
      target: 20000,
      color: '#3b82f6',
      currency: 'USD',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Dream Vacation',
      current: 3500,
      target: 5000,
      color: '#10b981',
      currency: 'USD',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'New Car',
      current: 12000,
      target: 30000,
      color: '#f59e0b',
      currency: 'USD',
    },
    {
      id: '4',
      name: 'Home Down Payment',
      current: 85000,
      target: 100000,
      color: '#8b5cf6',
      currency: 'USD',
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
