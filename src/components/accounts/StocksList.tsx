import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { StockAutocomplete } from './StockAutocomplete';
import { DonutChart, DonutChartLegend } from '../charts/DonutChart';
import { PieChart, TrendingUp } from 'lucide-react';

// Stock logo component with error handling
function StockLogo({ logo, symbol }: { logo: string | null; symbol: string }) {
  const [hasError, setHasError] = useState(false);

  if (!logo || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold text-sm flex-shrink-0">
        {symbol.slice(0, 2)}
      </div>
    );
  }

  // Only allow https URLs to prevent protocol-based attacks
  const isValidUrl = logo.startsWith('https://');
  if (!isValidUrl) {
    return (
      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold text-sm flex-shrink-0">
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={symbol}
      className="w-10 h-10 rounded-lg object-contain bg-white border border-border flex-shrink-0"
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

interface Stock {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  symbol: string;
  exchange: string | null;
  securityName: string | null;
  logo: string | null;
  shares: number;
  avgCostBasis: number;
  totalCostBasis: number;
  currentPrice: number;
  priceUpdatedAt: Date | null;
  broker: string | null;
  brokerAccountId: string | null;
  dividendYield: number | null;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  createdAt: Date;
}

interface AddStockFormData {
  symbol: string;
  name: string;
  exchange: string;
  securityName: string;
  shares: string;
  avgCostBasis: string;
  currentPrice: string;
  broker: string;
  currency: string;
  dividendYield: string;
  logo?: string;
}

const initialFormData: AddStockFormData = {
  symbol: '',
  name: '',
  exchange: '',
  securityName: '',
  shares: '0',
  avgCostBasis: '0',
  currentPrice: '0',
  broker: '',
  currency: 'USD',
  dividendYield: '0',
  logo: '',
};

export function StocksList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddStockFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: stocks, isLoading, error } = useQuery<Stock[]>({
    queryKey: ['accounts', 'stocks'],
    queryFn: async () => {
      const res = await fetch('/api/accounts/stocks');
      if (!res.ok) throw new Error('Failed to fetch stocks');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddStockFormData) => {
      const res = await fetch('/api/accounts/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: data.symbol,
          name: data.name || undefined,
          exchange: data.exchange || undefined,
          securityName: data.securityName || undefined,
          shares: parseFloat(data.shares) || 0,
          avgCostBasis: parseFloat(data.avgCostBasis) || 0,
          currentPrice: parseFloat(data.currentPrice) || 0,
          broker: data.broker || undefined,
          currency: data.currency,
          dividendYield: parseFloat(data.dividendYield) / 100 || 0,
          logo: data.logo || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add stock');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowAddForm(false);
      setFormData(initialFormData);
    },
  });

  const handleStockSelect = (stock: {
    symbol: string;
    name: string;
    exchange: string;
    logo?: string;
    currentPrice?: number;
  }) => {
    setFormData(prev => ({
      ...prev,
      symbol: stock.symbol,
      securityName: stock.name,
      exchange: stock.exchange,
      currentPrice: stock.currentPrice?.toString() || prev.currentPrice,
      logo: stock.logo || '',
    }));
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete stock');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading stocks</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const totalMarketValue = stocks?.reduce((sum, s) => sum + s.marketValue, 0) || 0;
  const totalCostBasis = stocks?.reduce((sum, s) => sum + s.totalCostBasis, 0) || 0;
  const totalGain = totalMarketValue - totalCostBasis;
  const totalGainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  // Prepare chart data with distinct colors per asset
  const CHART_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];
  const allocationData = stocks?.map((stock, i) => ({
    label: stock.symbol,
    value: stock.marketValue,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  })) || [];

  return (
    <div className="space-y-8">
      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Value */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Stock Portfolio</CardTitle>
              <CardDescription>Total market value</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums">
                {formatCurrency(totalMarketValue, 'USD')}
              </div>
              <div className={cn(
                'text-sm font-medium',
                totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {formatCurrency(totalGain, 'USD')} ({formatPercent(totalGainPercent)})
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Allocation Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Portfolio Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stocks && stocks.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 1 }}
                  className="shrink-0"
                >
                  <DonutChart
                    segments={allocationData}
                    size={140}
                    strokeWidth={20}
                    centerValue={formatCurrency(totalMarketValue, 'USD')}
                    centerLabel="Total"
                  />
                </motion.div>
                <div className="flex-1 w-full max-w-xs">
                  <DonutChartLegend
                    segments={allocationData}
                    total={totalMarketValue}
                    formatValue={(v) => formatCurrency(v, 'USD')}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-text-muted text-sm">
                <p>Add stocks to see allocation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!showAddForm && (
        <div className="flex items-center justify-end">
          <Button onClick={() => setShowAddForm(true)}>
            + Add Stock Holding
          </Button>
        </div>
      )}

      {/* Gains/Losses Bar Chart */}
      {stocks && stocks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Unrealized Gains / Losses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const maxGain = Math.max(...stocks.map(s => Math.abs(s.unrealizedGain)));
                return stocks.map((stock, index) => {
                const isPositive = stock.unrealizedGain >= 0;
                const barWidth = maxGain > 0 ? (Math.abs(stock.unrealizedGain) / maxGain) * 100 : 0;
                
                return (
                  <motion.div
                    key={stock.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-16 text-sm font-medium text-text-primary">
                      {stock.symbol}
                    </div>
                    <div className="flex-1 h-8 bg-bg-surface/70 rounded-full overflow-hidden relative">
                      <motion.div
                        className={cn(
                          'h-full rounded-full flex items-center justify-end px-2',
                          isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(barWidth, 5)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                      >
                        <span className="text-xs font-medium text-white whitespace-nowrap">
                          {formatCurrency(Math.abs(stock.unrealizedGain), stock.currency)}
                        </span>
                      </motion.div>
                    </div>
                    <div className={cn(
                      'w-20 text-right text-sm font-medium tabular-nums',
                      isPositive ? 'text-emerald-600' : 'text-rose-600'
                    )}>
                      {isPositive ? '+' : ''}{stock.unrealizedGainPercent.toFixed(1)}%
                    </div>
                  </motion.div>
                );
              });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Stock Button / Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Stock Holding</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Ticker Symbol *</Label>
                  <StockAutocomplete
                    value={formData.symbol}
                    onChange={(value) => setFormData(prev => ({ ...prev, symbol: value }))}
                    onSelectStock={handleStockSelect}
                    placeholder="Search ticker..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityName">Company Name</Label>
                  <StockAutocomplete
                    value={formData.securityName}
                    onChange={(value) => setFormData(prev => ({ ...prev, securityName: value }))}
                    onSelectStock={handleStockSelect}
                    placeholder="Search company..."
                    mode="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange">Exchange</Label>
                  <Input
                    id="exchange"
                    name="exchange"
                    value={formData.exchange}
                    onChange={handleInputChange}
                    placeholder="e.g., NASDAQ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shares">Number of Shares</Label>
                  <Input
                    id="shares"
                    name="shares"
                    type="number"
                    step="0.0001"
                    value={formData.shares}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgCostBasis">Avg Cost Per Share</Label>
                  <Input
                    id="avgCostBasis"
                    name="avgCostBasis"
                    type="number"
                    step="0.01"
                    value={formData.avgCostBasis}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentPrice">Current Price</Label>
                  <Input
                    id="currentPrice"
                    name="currentPrice"
                    type="number"
                    step="0.01"
                    value={formData.currentPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="broker">Broker</Label>
                  <Input
                    id="broker"
                    name="broker"
                    value={formData.broker}
                    onChange={handleInputChange}
                    placeholder="e.g., Vanguard, Fidelity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
                  <Input
                    id="dividendYield"
                    name="dividendYield"
                    type="number"
                    step="0.01"
                    value={formData.dividendYield}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Stock'}
                </Button>
              </div>
              {createMutation.error && (
                <p className="text-red-600 text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Stocks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stocks?.map(stock => (
          <Card key={stock.id} className={cn(!stock.isActive && 'opacity-50')}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <StockLogo logo={stock.logo} symbol={stock.symbol} />
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {stock.symbol}
                      {stock.exchange && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {stock.exchange}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {stock.securityName || stock.name}
                      {stock.broker && ` • ${stock.broker}`}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Market Value</span>
                  <span className="text-xl font-bold tabular-nums">
                    {formatCurrency(stock.marketValue, stock.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Shares</span>
                    <div className="font-medium tabular-nums">{stock.shares.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price</span>
                    <div className="font-medium tabular-nums">{formatCurrency(stock.currentPrice, stock.currency)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost Basis</span>
                    <div className="font-medium tabular-nums">{formatCurrency(stock.totalCostBasis, stock.currency)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gain/Loss</span>
                    <div className={cn(
                      'font-medium',
                      stock.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatPercent(stock.unrealizedGainPercent)}
                    </div>
                  </div>
                </div>

                {stock.dividendYield && stock.dividendYield > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Dividend: {(stock.dividendYield * 100).toFixed(2)}% yield
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/accounts/${stock.id}`}>View</a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this stock?')) {
                        deleteMutation.mutate(stock.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {stocks?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>No stock holdings yet.</p>
            <p className="text-sm">Click "Add Stock Holding" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
