import { useState, useEffect } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Lightbulb,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  Target,
  CreditCard,
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Insight {
  id: string;
  type: 'spending_pattern' | 'saving_opportunity' | 'investment_insight' | 'debt_recommendation' | 'budget_alert' | 'goal_progress' | 'anomaly' | 'general';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actionItems?: {
    title: string;
    description: string;
    estimatedImpact?: string;
  }[];
  relatedMetrics?: {
    metric: string;
    currentValue: string;
    targetValue?: string;
    trend?: 'improving' | 'declining' | 'stable';
  };
}

interface InsightsData {
  insights: Insight[];
  summary: string;
  generatedAt: string;
}

interface InsightsResponse {
  success: boolean;
  data: InsightsData;
  healthStatus: 'healthy' | 'moderate' | 'at-risk';
  metrics: {
    savingsRate?: number;
    debtToIncomeRatio?: number;
    runwayMonths?: number;
  };
}

interface InsightsStatus {
  configured: boolean;
  healthStatus: 'healthy' | 'moderate' | 'at-risk';
  metrics: {
    savingsRate?: number;
    debtToIncomeRatio?: number;
    runwayMonths?: number;
  };
  recommendations: string[];
  focusAreas: {
    id: string;
    label: string;
    description: string;
  }[];
}

const insightTypeConfig = {
  spending_pattern: {
    icon: TrendingUp,
    label: 'Spending',
    color: 'text-blue-600 bg-blue-100',
  },
  saving_opportunity: {
    icon: PiggyBank,
    label: 'Savings',
    color: 'text-green-600 bg-green-100',
  },
  investment_insight: {
    icon: Sparkles,
    label: 'Investment',
    color: 'text-purple-600 bg-purple-100',
  },
  debt_recommendation: {
    icon: CreditCard,
    label: 'Debt',
    color: 'text-red-600 bg-red-100',
  },
  budget_alert: {
    icon: AlertTriangle,
    label: 'Budget',
    color: 'text-orange-600 bg-orange-100',
  },
  goal_progress: {
    icon: Target,
    label: 'Goals',
    color: 'text-teal-600 bg-teal-100',
  },
  anomaly: {
    icon: AlertCircle,
    label: 'Alert',
    color: 'text-yellow-600 bg-yellow-100',
  },
  general: {
    icon: Lightbulb,
    label: 'Insight',
    color: 'text-indigo-600 bg-indigo-100',
  },
};

const impactConfig = {
  high: {
    label: 'High Impact',
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  medium: {
    label: 'Medium Impact',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  low: {
    label: 'Low Impact',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
};

const healthStatusConfig = {
  healthy: {
    label: 'Healthy',
    color: 'text-green-600 bg-green-100',
    icon: CheckCircle2,
  },
  moderate: {
    label: 'Moderate',
    color: 'text-yellow-600 bg-yellow-100',
    icon: AlertTriangle,
  },
  'at-risk': {
    label: 'At Risk',
    color: 'text-red-600 bg-red-100',
    icon: AlertCircle,
  },
};

export function AIInsightsWidget() {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [focusAreas] = useState(['spending', 'saving', 'investing']);

  // Fetch insights status
  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery<InsightsStatus>({
    queryKey: ['ai-insights', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/ai/insights');
      if (!res.ok) throw new Error('Failed to fetch insights status');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate insights mutation
  const generateInsights = useMutation<InsightsResponse>({
    mutationFn: async () => {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus: focusAreas,
          timeframe: '3m',
          maxInsights: 5,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate insights');
      return res.json();
    },
  });

  const insights = generateInsights.data?.data;
  const isLoading = statusLoading || generateInsights.isPending;
  const isConfigured = status?.configured ?? false;
  const healthStatus = status?.healthStatus || 'healthy';

  const handleGenerate = () => {
    generateInsights.mutate();
  };

  // Format percentage
  const formatPercent = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format months
  const formatMonths = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(1)} months`;
  };

  if (statusError) {
    return (
      <Card className="border-danger">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-danger">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load AI insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Insights</CardTitle>
            <p className="text-xs text-text-muted">
              Personalized financial recommendations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && isConfigured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={generateInsights.isPending}
              className="text-text-muted hover:text-text-primary"
            >
              {generateInsights.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && !insights ? (
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-lg bg-content-bg" />
            <div className="h-20 animate-pulse rounded-lg bg-content-bg" />
            <div className="h-20 animate-pulse rounded-lg bg-content-bg" />
          </div>
        ) : !isConfigured ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-text-primary">
              AI Not Configured
            </h3>
            <p className="mt-1 text-xs text-text-muted max-w-xs">
              Set up an AI provider to get personalized financial insights
            </p>
            <Button asChild size="sm" className="mt-3">
              <a href="/settings/ai">Configure AI</a>
            </Button>
          </div>
        ) : !insights ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Lightbulb className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-text-primary">
              Generate Insights
            </h3>
            <p className="mt-1 text-xs text-text-muted max-w-xs">
              Get AI-powered recommendations based on your financial data
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={handleGenerate}
              disabled={generateInsights.isPending}
            >
              {generateInsights.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Health Status */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-content-bg p-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const config = healthStatusConfig[healthStatus];
                  const Icon = config.icon;
                  return (
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Financial Health: {healthStatusConfig[healthStatus].label}
                  </p>
                  <p className="text-xs text-text-muted">
                    {insights.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            {status?.metrics && (
              <div className="grid grid-cols-3 gap-2">
                <MetricCard
                  label="Savings Rate"
                  value={formatPercent(status.metrics.savingsRate)}
                  trend={status.metrics.savingsRate && status.metrics.savingsRate >= 0.2 ? 'good' : 'warning'}
                />
                <MetricCard
                  label="Debt-to-Income"
                  value={formatPercent(status.metrics.debtToIncomeRatio)}
                  trend={status.metrics.debtToIncomeRatio && status.metrics.debtToIncomeRatio <= 0.3 ? 'good' : 'warning'}
                />
                <MetricCard
                  label="Emergency Fund"
                  value={formatMonths(status.metrics.runwayMonths)}
                  trend={status.metrics.runwayMonths && status.metrics.runwayMonths >= 6 ? 'good' : status.metrics.runwayMonths && status.metrics.runwayMonths >= 3 ? 'warning' : 'bad'}
                />
              </div>
            )}

            {/* Insights List */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Recommendations
              </h4>
              {insights.insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onClick={() => setSelectedInsight(insight)}
                />
              ))}
            </div>

            {/* Generated Time */}
            <p className="text-xs text-text-muted text-center">
              Generated {new Date(insights.generatedAt).toLocaleString()}
            </p>
          </>
        )}
      </CardContent>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <InsightDetailModal
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
        />
      )}
    </Card>
  );
}

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: 'good' | 'warning' | 'bad';
}) {
  const trendColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    bad: 'text-red-600',
  };

  return (
    <div className="rounded-lg border border-border bg-content-bg p-2 text-center">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={cn('text-sm font-semibold', trendColors[trend])}>{value}</p>
    </div>
  );
}

function InsightCard({
  insight,
  onClick,
}: {
  insight: Insight;
  onClick: () => void;
}) {
  const config = insightTypeConfig[insight.type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-content-bg p-3 text-left transition-colors hover:border-primary-600 hover:bg-primary-50/50"
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-text-primary truncate">
              {insight.title}
            </h5>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full border',
                impactConfig[insight.impact].color
              )}
            >
              {impactConfig[insight.impact].label}
            </span>
          </div>
          <p className="text-xs text-text-muted line-clamp-2 mt-0.5">
            {insight.description}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
      </div>
    </button>
  );
}

function InsightDetailModal({
  insight,
  onClose,
}: {
  insight: Insight;
  onClose: () => void;
}) {
  const config = insightTypeConfig[insight.type];
  const Icon = config.icon;
  const focusTrapRef = useFocusTrap(true);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insight-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <Card ref={focusTrapRef} className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle id="insight-modal-title" className="text-lg">{insight.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-text-muted">{config.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full border',
                    impactConfig[insight.impact].color
                  )}
                >
                  {impactConfig[insight.impact].label}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="sr-only">Close</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-text-primary">{insight.description}</p>

          {insight.relatedMetrics && (
            <div className="rounded-lg bg-content-bg p-3">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                Related Metric
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{insight.relatedMetrics.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {insight.relatedMetrics.currentValue}
                  </span>
                  {insight.relatedMetrics.targetValue && (
                    <span className="text-xs text-text-muted">
                      / {insight.relatedMetrics.targetValue}
                    </span>
                  )}
                </div>
              </div>
              {insight.relatedMetrics.trend && (
                <div className="mt-1">
                  <span
                    className={cn(
                      'text-xs',
                      insight.relatedMetrics.trend === 'improving'
                        ? 'text-green-600'
                        : insight.relatedMetrics.trend === 'declining'
                        ? 'text-red-600'
                        : 'text-text-muted'
                    )}
                  >
                    Trend: {insight.relatedMetrics.trend}
                  </span>
                </div>
              )}
            </div>
          )}

          {insight.actionable && insight.actionItems && insight.actionItems.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                Recommended Actions
              </h4>
              <div className="space-y-2">
                {insight.actionItems.map((action, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border bg-content-bg p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-medium text-text-primary">
                        {action.title}
                      </h5>
                      {action.estimatedImpact && (
                        <span className="text-xs text-green-600 whitespace-nowrap">
                          {action.estimatedImpact}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
