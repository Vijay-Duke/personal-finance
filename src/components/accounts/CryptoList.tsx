import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { TrendingUp, Wallet, Coins, Plus, Trash2, Eye } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { PageFooter } from '../ui/PageFooter';
import { SectionHeader } from '../ui/SectionHeader';
import { CryptoAutocomplete } from './CryptoAutocomplete';

const CRYPTO_AMBER = '#c4a35a';

// Crypto logo component with error handling
function CryptoLogo({ logo, symbol }: { logo: string | null; symbol: string }) {
  const [hasError, setHasError] = useState(false);

  if (!logo || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: `${CRYPTO_AMBER}15`, color: CRYPTO_AMBER }}>
        {symbol.slice(0, 2)}
      </div>
    );
  }

  // Only allow https URLs to prevent protocol-based attacks
  const isValidUrl = logo.startsWith('https://');
  if (!isValidUrl) {
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: `${CRYPTO_AMBER}15`, color: CRYPTO_AMBER }}>
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={symbol}
      className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

interface CryptoAsset {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  symbol: string;
  cryptoName: string | null;
  coingeckoId: string | null;
  logo: string | null;
  network: string | null;
  holdings: number;
  avgCostBasis: number;
  totalCostBasis: number;
  currentPrice: number;
  priceUpdatedAt: Date | null;
  storageType: string | null;
  exchangeName: string | null;
  walletAddress: string | null;
  walletName: string | null;
  isStaked: boolean;
  stakingApy: number | null;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  createdAt: Date;
}

interface AddCryptoFormData {
  symbol: string;
  name: string;
  coingeckoId: string;
  network: string;
  holdings: string;
  avgCostBasis: string;
  currentPrice: string;
  storageType: string;
  exchangeName: string;
  walletName: string;
  isStaked: boolean;
  stakingApy: string;
  currency: string;
  logo: string;
}

const initialFormData: AddCryptoFormData = {
  symbol: '',
  name: '',
  coingeckoId: '',
  network: '',
  holdings: '0',
  avgCostBasis: '0',
  currentPrice: '0',
  storageType: 'exchange',
  exchangeName: '',
  walletName: '',
  isStaked: false,
  stakingApy: '0',
  currency: 'USD',
  logo: '',
};

export function CryptoList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddCryptoFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: cryptos, isLoading, error } = useQuery<CryptoAsset[]>({
    queryKey: ['accounts', 'crypto'],
    queryFn: async () => {
      const res = await fetch('/api/accounts/crypto');
      if (!res.ok) throw new Error('Failed to fetch crypto');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddCryptoFormData) => {
      const res = await fetch('/api/accounts/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: data.symbol,
          name: data.name || undefined,
          coingeckoId: data.coingeckoId || undefined,
          network: data.network || undefined,
          holdings: parseFloat(data.holdings) || 0,
          avgCostBasis: parseFloat(data.avgCostBasis) || 0,
          currentPrice: parseFloat(data.currentPrice) || 0,
          storageType: data.storageType,
          exchangeName: data.exchangeName || undefined,
          walletName: data.walletName || undefined,
          isStaked: data.isStaked,
          stakingApy: parseFloat(data.stakingApy) / 100 || 0,
          currency: data.currency,
          logo: data.logo || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add crypto');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowAddForm(false);
      setFormData(initialFormData);
    },
  });

  const handleCryptoSelect = useCallback((crypto: {
    symbol: string;
    name: string;
    coingeckoId: string;
    logo?: string;
    currentPrice?: number;
  }) => {
    setFormData(prev => ({
      ...prev,
      symbol: crypto.symbol,
      name: crypto.name,
      coingeckoId: crypto.coingeckoId,
      logo: crypto.logo || '',
      currentPrice: crypto.currentPrice?.toString() || prev.currentPrice,
    }));
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete crypto');
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
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  const getStorageTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      exchange: 'Exchange',
      hot_wallet: 'Hot Wallet',
      cold_wallet: 'Cold Wallet',
      hardware: 'Hardware Wallet',
    };
    return type ? labels[type] || type : 'Unknown';
  };

  const getStorageColor = (type: string | null) => {
    const colors: Record<string, string> = {
      exchange: '#3b82f6',
      hot_wallet: '#f59e0b',
      cold_wallet: '#10b981',
      hardware: '#8b5cf6',
    };
    return type ? colors[type] || '#6b7280' : '#6b7280';
  };

  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="CRYPTO HOLDINGS" title="Digital Frontier" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-[var(--radius-xl)] animate-[shimmer_1.8s_ease-in-out_infinite]"
              style={{ background: 'linear-gradient(90deg, var(--color-skeleton-bg) 25%, var(--color-skeleton-shine) 50%, var(--color-skeleton-bg) 75%)', backgroundSize: '200% 100%' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-16">
        <PageHeader label="CRYPTO HOLDINGS" title="Digital Frontier" />
        <div className="flex flex-col items-center py-16">
          <p className="text-[var(--color-danger)] text-[15px]">Something needs attention</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })} className="mt-6">Retry</Button>
        </div>
      </div>
    );
  }

  const totalMarketValue = cryptos?.reduce((sum, c) => sum + c.marketValue, 0) || 0;
  const totalCostBasis = cryptos?.reduce((sum, c) => sum + c.totalCostBasis, 0) || 0;
  const totalGain = totalMarketValue - totalCostBasis;
  const totalGainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  // Calculate allocation percentages for progress bars
  const allocationData = cryptos?.map((crypto) => ({
    ...crypto,
    percent: totalMarketValue > 0 ? (crypto.marketValue / totalMarketValue) * 100 : 0,
  })) || [];

  // Storage type breakdown
  const storageData = cryptos?.reduce((acc, crypto) => {
    const type = crypto.storageType || 'unknown';
    const label = getStorageTypeLabel(type);
    const existing = acc.find(a => a.label === label);
    if (existing) {
      existing.value += crypto.marketValue;
    } else {
      acc.push({
        label,
        value: crypto.marketValue,
        type,
      });
    }
    return acc;
  }, [] as { label: string; value: number; type: string }[]) || [];

  return (
    <div className="space-y-16">
      <PageHeader label="CRYPTO HOLDINGS" title="Digital Frontier">
        <div className="hero-number">{formatCurrency(totalMarketValue, 'USD')}</div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Across {cryptos?.length || 0} holding{(cryptos?.length || 0) !== 1 ? 's' : ''}
        </p>
      </PageHeader>

      {/* Portfolio Summary */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left: Total Value */}
          <div className="flex-1 p-6 sm:p-8 border-b sm:border-b-0 sm:border-r" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${CRYPTO_AMBER}15` }}>
                <Coins className="w-5 h-5" style={{ color: CRYPTO_AMBER }} />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Crypto Portfolio</p>
                <p className="text-xs text-[var(--color-text-muted)]">Total market value</p>
              </div>
            </div>
            <div className="font-display text-3xl sm:text-4xl font-light tabular-nums tracking-tight text-[var(--color-text-primary)]">
              {formatCurrency(totalMarketValue, 'USD')}
            </div>
            <div className={cn(
              'mt-2 text-sm font-medium flex items-center gap-1.5',
              totalGain >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            )}>
              <span className="text-lg">{totalGain >= 0 ? '\u2197' : '\u2198'}</span>
              {formatCurrency(totalGain, 'USD')} ({formatPercent(totalGainPercent)})
            </div>
          </div>

          {/* Right: Allocation List */}
          <div className="flex-1 p-6 sm:p-8">
            <h3 className="text-sm text-[var(--color-text-secondary)] mb-4">Allocation</h3>
            {cryptos && cryptos.length > 0 ? (
              <div className="space-y-4">
                {allocationData.map((crypto, index) => (
                  <motion.div
                    key={crypto.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{crypto.symbol}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{crypto.holdings} coins</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{formatCurrency(crypto.marketValue, 'USD')}</span>
                        <span className="text-xs text-[var(--color-text-muted)] ml-2">{crypto.percent.toFixed(1)}%</span>
                      </div>
                    </div>
                    {/* Colored underline bar */}
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: CRYPTO_AMBER }}
                        initial={{ width: 0 }}
                        animate={{ width: `${crypto.percent}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Add crypto to see allocation</p>
            )}
          </div>
        </div>
      </Card>

      {/* Storage Distribution & Gains */}
      {cryptos && cryptos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Type Distribution */}
          <Card>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-6">
              <Wallet className="w-4 h-4" style={{ color: CRYPTO_AMBER }} />
              Storage Distribution
            </h3>
            <div className="space-y-3">
              {storageData.map((item, index) => {
                const percent = totalMarketValue > 0 ? (item.value / totalMarketValue) * 100 : 0;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[var(--color-text-primary)]">{item.label}</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">{formatCurrency(item.value, 'USD')}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: 'var(--color-text-muted)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, delay: 0.2 + index * 0.08 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          {/* Gains/Losses */}
          <Card>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4" style={{ color: CRYPTO_AMBER }} />
              Unrealized Gains / Losses
            </h3>
            <div className="space-y-6">
              {cryptos.map((crypto, index) => {
                const isPositive = crypto.unrealizedGain >= 0;

                return (
                  <motion.div
                    key={crypto.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                  >
                    {/* Top row: Symbol, value, percentage */}
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <CryptoLogo logo={crypto.logo} symbol={crypto.symbol} />
                        <div>
                          <span className="text-base font-semibold text-[var(--color-text-primary)]">{crypto.symbol}</span>
                          <p className="text-xs text-[var(--color-text-muted)]">{crypto.holdings} coins</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-[var(--color-text-primary)]">
                          {formatCurrency(crypto.unrealizedGain, crypto.currency)}
                        </div>
                        <div className={cn(
                          'text-xs font-medium tabular-nums',
                          isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                        )}>
                          {isPositive ? '+' : ''}{crypto.unrealizedGainPercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    {/* Decorative underline bar */}
                    <div className="h-0.5 w-12 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Holdings Section */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <SectionHeader label="YOUR HOLDINGS" title="Portfolio" />
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-[18px] h-[18px]" />
              Add Crypto
            </Button>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Add Crypto Holding</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <CryptoAutocomplete
                    value={formData.symbol}
                    onChange={(value) => setFormData(prev => ({ ...prev, symbol: value }))}
                    onSelectCrypto={handleCryptoSelect}
                    placeholder="Search crypto..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Bitcoin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <Input
                    id="network"
                    name="network"
                    value={formData.network}
                    onChange={handleInputChange}
                    placeholder="e.g., Ethereum, Polygon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holdings">Amount Held</Label>
                  <Input
                    id="holdings"
                    name="holdings"
                    type="number"
                    step="0.00000001"
                    value={formData.holdings}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgCostBasis">Avg Cost Per Unit</Label>
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
                  <Label htmlFor="storageType">Storage Type</Label>
                  <select
                    id="storageType"
                    name="storageType"
                    value={formData.storageType}
                    onChange={handleInputChange}
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{ backgroundColor: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="exchange">Exchange</option>
                    <option value="hot_wallet">Hot Wallet</option>
                    <option value="cold_wallet">Cold Wallet</option>
                    <option value="hardware">Hardware Wallet</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchangeName">Exchange/Wallet Name</Label>
                  <Input
                    id="exchangeName"
                    name="exchangeName"
                    value={formData.exchangeName}
                    onChange={handleInputChange}
                    placeholder="e.g., Coinbase, Ledger"
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
                    style={{ backgroundColor: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stakingApy">Staking APY (%)</Label>
                  <Input
                    id="stakingApy"
                    name="stakingApy"
                    type="number"
                    step="0.01"
                    value={formData.stakingApy}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="isStaked"
                    name="isStaked"
                    checked={formData.isStaked}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded"
                    style={{ borderColor: 'var(--color-input-border)' }}
                  />
                  <Label htmlFor="isStaked">Currently Staked</Label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Crypto'}
                </Button>
              </div>
              {createMutation.error && (
                <p className="text-[var(--color-danger)] text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </Card>
        )}

        {/* Crypto Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {cryptos?.map((crypto, index) => (
            <Card key={crypto.id} className={cn(!crypto.isActive && 'opacity-50')} style={{ animationDelay: `${index * 80}ms` }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: `${CRYPTO_AMBER}15`, color: CRYPTO_AMBER }}>
                  <CryptoLogo logo={crypto.logo} symbol={crypto.symbol} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--color-text-primary)] truncate">{crypto.symbol}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                        {crypto.cryptoName || crypto.name}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium shrink-0"
                      style={{ backgroundColor: `${CRYPTO_AMBER}15`, color: CRYPTO_AMBER }}>
                      {getStorageTypeLabel(crypto.storageType)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="font-display text-2xl font-light text-[var(--color-text-primary)] tabular-nums tracking-tight">
                      {formatCurrency(crypto.marketValue, crypto.currency)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <span className="text-[var(--color-text-muted)]">Holdings</span>
                      <div className="font-medium">{crypto.holdings.toLocaleString(undefined, { maximumFractionDigits: 8 })}</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Price</span>
                      <div className="font-medium">{formatCurrency(crypto.currentPrice, crypto.currency)}</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Cost Basis</span>
                      <div className="font-medium">{formatCurrency(crypto.totalCostBasis, crypto.currency)}</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">Gain/Loss</span>
                      <div className={cn('font-medium', crypto.unrealizedGain >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}>
                        {formatPercent(crypto.unrealizedGainPercent)}
                      </div>
                    </div>
                  </div>
                  {(crypto.exchangeName || crypto.walletName) && (
                    <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                      {crypto.exchangeName || crypto.walletName}
                    </p>
                  )}
                  {crypto.isStaked && crypto.stakingApy && crypto.stakingApy > 0 && (
                    <p className="text-[13px] mt-1" style={{ color: CRYPTO_AMBER }}>
                      Staking: {(crypto.stakingApy * 100).toFixed(2)}% APY
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                    <Button variant="outline" size="sm" asChild className="gap-1.5">
                      <a href={`/accounts/${crypto.id}`}><Eye className="w-3.5 h-3.5" />View</a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] gap-1.5"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this crypto?')) {
                          deleteMutation.mutate(crypto.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {cryptos?.length === 0 && !showAddForm && (
            <div className="col-span-full flex flex-col items-center py-16">
              <div className="mb-4 opacity-40" style={{ color: 'var(--color-text-muted)' }}>
                <Coins className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">A blank canvas</h3>
              <p className="mt-2 text-[15px] text-[var(--color-text-secondary)] max-w-[400px] text-center">
                Begin tracking your crypto holdings to see your digital frontier at a glance.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="mt-6 gap-2">
                <Plus className="w-[18px] h-[18px]" />Add Your First Crypto
              </Button>
            </div>
          )}
        </div>
      </div>

      <PageFooter
        icon={<Coins className="w-5 h-5" />}
        label="YOUR DIGITAL FRONTIER"
        quote="The future of money is digital currency."
      />
    </div>
  );
}
