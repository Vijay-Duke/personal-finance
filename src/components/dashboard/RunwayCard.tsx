import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface RunwayData {
  liquidAssets: {
    total: number;
    accounts: number;
  };
  expenses: {
    averageMonthly: number;
  };
  income: {
    averageMonthly: number;
  };
  runway: {
    months: number | null;
    formatted: string;
  };
  savings: {
    netMonthly: number;
    rate: number;
    isPositive: boolean;
  };
  emergencyFund: {
    target: number;
    current: number;
    progress: number;
    monthsCovered: number;
    isHealthy: boolean;
  };
  currency: string;
}

export function RunwayCard() {
  const { data, isLoading, error } = useQuery<RunwayData>({
    queryKey: ['runway'],
    queryFn: async () => {
      const res = await fetch('/api/projections/runway');
      if (!res.ok) throw new Error('Failed to fetch runway data');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground text-sm">
            Unable to load runway data
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRunwayColor = () => {
    if (data.runway.months === null) return 'text-muted-foreground';
    if (data.runway.months < 3) return 'text-red-600';
    if (data.runway.months < 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getEmergencyFundStatus = () => {
    if (data.emergencyFund.progress >= 100) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        text: 'Fully funded',
        color: 'text-green-600',
      };
    }
    if (data.emergencyFund.progress >= 50) {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-600" />,
        text: 'Partially funded',
        color: 'text-yellow-600',
      };
    }
    return {
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      text: 'Needs attention',
      color: 'text-red-600',
    };
  };

  const emergencyStatus = getEmergencyFundStatus();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Financial Runway
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Runway Display */}
        <div className="text-center py-2">
          <div className={`text-3xl font-bold ${getRunwayColor()}`}>
            {data.runway.formatted}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            based on current spending
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {/* Monthly Income */}
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              Avg. Income
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(data.income.averageMonthly)}/mo
            </div>
          </div>

          {/* Monthly Expenses */}
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-600" />
              Avg. Expenses
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(data.expenses.averageMonthly)}/mo
            </div>
          </div>

          {/* Savings Rate */}
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {data.savings.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              Savings Rate
            </div>
            <div
              className={`text-sm font-medium ${
                data.savings.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {data.savings.rate.toFixed(1)}%
            </div>
          </div>

          {/* Liquid Assets */}
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Liquid Assets
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(data.liquidAssets.total)}
            </div>
          </div>
        </div>

        {/* Emergency Fund Progress */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {emergencyStatus.icon}
              <span>Emergency Fund</span>
            </div>
            <span className={`text-xs font-medium ${emergencyStatus.color}`}>
              {data.emergencyFund.monthsCovered.toFixed(1)} months
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                data.emergencyFund.progress >= 100
                  ? 'bg-green-500'
                  : data.emergencyFund.progress >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, data.emergencyFund.progress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{Math.round(data.emergencyFund.progress)}% of 6-month target</span>
            <span>{formatCurrency(data.emergencyFund.target)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
