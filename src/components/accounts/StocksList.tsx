import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Plus, Trash2, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '../ui/PageHeader';
import { PageFooter } from '../ui/PageFooter';
import { SectionHeader } from '../ui/SectionHeader';
import { cn } from '@/lib/utils';
import { StockAutocomplete } from './StockAutocomplete';

// Design system: Stocks/ETFs asset color is Dusty Indigo
const STOCK_INDIGO = '#7e82b0';

// Stock logo component with error handling
function StockLogo({ logo, symbol }: { logo: string | null; symbol: string }) {
  const [hasError, setHasError] = useState(false);

  if (!logo || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: `${STOCK_INDIGO}15`, color: STOCK_INDIGO }}>
        {symbol.slice(0, 2)}
      </div>
    );
  }

  // Only allow https URLs to prevent protocol-based attacks
  const isValidUrl = logo.startsWith('https://');
  if (!isValidUrl) {
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: `${STOCK_INDIGO}15`, color: STOCK_INDIGO }}>
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

  const formatCurrency = (amount: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount);
    }
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="STOCK HOLDINGS" title="Growth Allocations" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-40 rounded-[var(--radius-xl)] animate-[shimmer_1.8s_ease-in-out_infinite]"
              style={{
                background: 'linear-gradient(90deg, var(--color-skeleton-bg) 25%, var(--color-skeleton-shine) 50%, var(--color-skeleton-bg) 75%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-16">
        <PageHeader label="STOCK HOLDINGS" title="Growth Allocations" />
        <div className="flex flex-col items-center py-16">
          <p className="text-[var(--color-danger)] text-[15px]">Something needs attention</p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })}
            className="mt-6"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalMarketValue = stocks?.reduce((sum, s) => sum + s.marketValue, 0) || 0;
  const totalCostBasis = stocks?.reduce((sum, s) => sum + s.totalCostBasis, 0) || 0;
  const totalGain = totalMarketValue - totalCostBasis;
  const totalGainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  // Prepare chart data with Stocks/ETFs color palette (Dusty Indigo per design system)
  const CHART_PALETTE = [
    '#7e82b0', // dusty indigo (primary for stocks)
    '#9b9ec4', // light indigo
    '#6b6f9c', // deep indigo
    '#b8bbd4', // pale indigo
    '#5f8563', // sage green (accent)
    '#7c9f80', // light sage
    '#6b665e', // warm gray
    '#8a857c', // neutral
  ];
  const allocationData = stocks?.map((stock, i) => ({
    label: stock.symbol,
    value: stock.marketValue,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  })) || [];

  return (
    <div className="space-y-16">
      {/* Page Header */}
      <PageHeader label="STOCK HOLDINGS" title="Growth Allocations">
        <div className="hero-number">{formatCurrency(totalMarketValue, 'USD')}</div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Across {stocks?.length || 0} holding{(stocks?.length || 0) !== 1 ? 's' : ''}
        </p>
      </PageHeader>

      {/* Portfolio Summary - Zen Style */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Left: Total Value */}
          <div className="flex-1 p-6 sm:p-8 border-b sm:border-b-0 sm:border-r border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#7e82b0]/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#7e82b0]" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Stock Portfolio</p>
                <p className="text-xs text-text-muted">Total market value</p>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-light tabular-nums tracking-tight text-text-primary">
              {formatCurrency(totalMarketValue, 'USD')}
            </div>
            <div className={cn(
              'mt-2 text-sm font-medium flex items-center gap-1.5',
              totalGain >= 0 ? 'text-success' : 'text-danger'
            )}>
              <span className="text-lg">{totalGain >= 0 ? '↗' : '↘'}</span>
              {formatCurrency(totalGain, 'USD')} ({formatPercent(totalGainPercent)})
            </div>
          </div>

          {/* Right: Allocation List */}
          <div className="flex-1 p-6 sm:p-8">
            <h3 className="text-sm text-text-secondary mb-4">Allocation</h3>
            {stocks && stocks.length > 0 ? (
              <div className="space-y-4">
                {stocks.map((stock, index) => {
                  const percent = totalMarketValue > 0 ? (stock.marketValue / totalMarketValue) * 100 : 0;
                  return (
                    <motion.div
                      key={stock.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.4 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{stock.symbol}</span>
                          <span className="text-xs text-text-muted">{stock.shares} shares</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-text-primary">{formatCurrency(stock.marketValue, 'USD')}</span>
                          <span className="text-xs text-text-muted ml-2">{percent.toFixed(1)}%</span>
                        </div>
                      </div>
                      {/* Colored underline bar - Zen style */}
                      <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[#7e82b0]"
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + index * 0.08, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Add stocks to see allocation</p>
            )}
          </div>
        </div>
      </Card>

      {/* Gains/Losses - Zen List Style per DESIGN_SYSTEM.md 9.7 */}
      {stocks && stocks.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4" style={{ color: STOCK_INDIGO }} />
            Unrealized Gains / Losses
          </h3>
          <div className="space-y-6">
            {stocks.map((stock, index) => {
              const isPositive = stock.unrealizedGain >= 0;

              return (
                <motion.div
                  key={stock.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                >
                  {/* Top row: Symbol, value, percentage */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <StockLogo logo={stock.logo} symbol={stock.symbol} />
                      <div>
                        <span className="text-base font-semibold text-text-primary">{stock.symbol}</span>
                        <p className="text-xs text-text-muted">{stock.shares} shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-text-primary">
                        {formatCurrency(stock.unrealizedGain, stock.currency)}
                      </div>
                      <div className={cn(
                        'text-xs font-medium tabular-nums',
                        isPositive ? 'text-success' : 'text-danger'
                      )}>
                        {isPositive ? '+' : ''}{stock.unrealizedGainPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {/* Decorative underline bar - 2px, muted, per design system */}
                  <div className="h-0.5 w-12 rounded-full bg-border" />
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Holdings Section Header + Add Button */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <SectionHeader label="YOUR HOLDINGS" title="Portfolio" />
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-[18px] h-[18px]" />
              Add Stock
            </Button>
          )}
        </div>

        {/* Add Stock Form */}
        {showAddForm ? (
          <Card>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
              Add Stock Holding
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
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
                <p className="text-[var(--color-danger)] text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </Card>
        ) : null}

        {/* Stocks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {stocks?.map((stock, index) => (
            <Card key={stock.id} className={cn(!stock.isActive && 'opacity-50')} style={{ animationDelay: `${index * 80}ms` }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: `${STOCK_INDIGO}15`, color: STOCK_INDIGO }}>
                  <StockLogo logo={stock.logo} symbol={stock.symbol} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--color-text-primary)] truncate">{stock.symbol}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                        {stock.securityName || stock.name}{stock.broker && ` · ${stock.broker}`}
                      </p>
                    </div>
                    {stock.exchange && (
                      <span className="text-xs text-[var(--color-text-muted)] shrink-0 font-mono">{stock.exchange}</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="font-display text-2xl font-light text-[var(--color-text-primary)] tabular-nums tracking-tight">
                      {formatCurrency(stock.marketValue, stock.currency)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Shares</span>
                      <div className="font-medium tabular-nums">{stock.shares.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Price</span>
                      <div className="font-medium tabular-nums">{formatCurrency(stock.currentPrice, stock.currency)}</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Cost Basis</span>
                      <div className="font-medium tabular-nums">{formatCurrency(stock.totalCostBasis, stock.currency)}</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Gain/Loss</span>
                      <div className={cn('font-medium', stock.unrealizedGain >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}>
                        {formatPercent(stock.unrealizedGainPercent)}
                      </div>
                    </div>
                  </div>
                  {stock.dividendYield != null && stock.dividendYield > 0 && (
                    <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                      {(stock.dividendYield * 100).toFixed(2)}% dividend yield
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                    <Button variant="outline" size="sm" asChild className="gap-1.5">
                      <a href={`/accounts/${stock.id}`}><Eye className="w-3.5 h-3.5" />View</a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] gap-1.5"
                      onClick={() => { if (confirm('Are you sure you want to delete this stock?')) { deleteMutation.mutate(stock.id); } }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {stocks?.length === 0 && !showAddForm && (
            <div className="col-span-full flex flex-col items-center py-16">
              <div className="mb-4 opacity-40" style={{ color: 'var(--color-text-muted)' }}>
                <TrendingUp className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                A blank canvas
              </h3>
              <p className="mt-2 text-[15px] text-[var(--color-text-secondary)] max-w-[400px] text-center">
                Begin tracking your stock holdings to see your growth allocations at a glance.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="mt-6 gap-2">
                <Plus className="w-[18px] h-[18px]" />
                Add Your First Stock
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Page Footer */}
      <PageFooter
        icon={<TrendingUp className="w-5 h-5" />}
        label="YOUR GROWTH ALLOCATIONS"
        quote="The stock market is a device for transferring money from the impatient to the patient."
      />
    </div>
  );
}
