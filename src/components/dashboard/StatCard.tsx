import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, change, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card-bg p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
          {change && (
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                change.trend === 'up' && 'text-success',
                change.trend === 'down' && 'text-danger',
                change.trend === 'neutral' && 'text-text-muted'
              )}
            >
              {change.trend === 'up' && '↑ '}
              {change.trend === 'down' && '↓ '}
              {change.value}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              iconColor || 'bg-primary-100 text-primary-600'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
