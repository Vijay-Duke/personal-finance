import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface CryptoAsset {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  symbol: string;
  cryptoName: string | null;
  coingeckoId: string | null;
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
}

const initialFormData: AddCryptoFormData = {
  symbol: '',
  name: '',
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

  const getStorageTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      exchange: 'Exchange',
      hot_wallet: 'Hot Wallet',
      cold_wallet: 'Cold Wallet',
      hardware: 'Hardware Wallet',
    };
    return type ? labels[type] || type : 'Unknown';
  };

  const getStorageTypeBadgeClass = (type: string | null) => {
    const classes: Record<string, string> = {
      exchange: 'bg-blue-100 text-blue-800',
      hot_wallet: 'bg-yellow-100 text-yellow-800',
      cold_wallet: 'bg-green-100 text-green-800',
      hardware: 'bg-purple-100 text-purple-800',
    };
    return type ? classes[type] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
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
        <p className="text-red-600">Error loading crypto</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const totalMarketValue = cryptos?.reduce((sum, c) => sum + c.marketValue, 0) || 0;
  const totalCostBasis = cryptos?.reduce((sum, c) => sum + c.totalCostBasis, 0) || 0;
  const totalGain = totalMarketValue - totalCostBasis;
  const totalGainPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Crypto Portfolio</CardTitle>
            <CardDescription>Total market value of holdings</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(totalMarketValue, 'USD')}
            </div>
            <div className={cn(
              'text-sm font-medium',
              totalGain >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(totalGain, 'USD')} ({formatPercent(totalGainPercent)})
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Crypto Button / Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Crypto Holding</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="e.g., BTC, ETH"
                    required
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="h-4 w-4 rounded border-gray-300"
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
                <p className="text-red-600 text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowAddForm(true)}>
          + Add Crypto Holding
        </Button>
      )}

      {/* Crypto List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cryptos?.map(crypto => (
          <Card key={crypto.id} className={cn(!crypto.isActive && 'opacity-50')}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {crypto.symbol}
                    {crypto.network && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {crypto.network}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {crypto.cryptoName || crypto.name}
                  </CardDescription>
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full font-medium',
                  getStorageTypeBadgeClass(crypto.storageType)
                )}>
                  {getStorageTypeLabel(crypto.storageType)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Market Value</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(crypto.marketValue, crypto.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Holdings</span>
                    <div className="font-medium">{crypto.holdings.toLocaleString(undefined, { maximumFractionDigits: 8 })}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price</span>
                    <div className="font-medium">{formatCurrency(crypto.currentPrice, crypto.currency)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost Basis</span>
                    <div className="font-medium">{formatCurrency(crypto.totalCostBasis, crypto.currency)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gain/Loss</span>
                    <div className={cn(
                      'font-medium',
                      crypto.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatPercent(crypto.unrealizedGainPercent)}
                    </div>
                  </div>
                </div>

                {(crypto.exchangeName || crypto.walletName) && (
                  <p className="text-sm text-muted-foreground">
                    {crypto.exchangeName || crypto.walletName}
                  </p>
                )}

                {crypto.isStaked && crypto.stakingApy && crypto.stakingApy > 0 && (
                  <p className="text-sm text-green-600">
                    Staking: {(crypto.stakingApy * 100).toFixed(2)}% APY
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/accounts/${crypto.id}`}>View</a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this crypto?')) {
                        deleteMutation.mutate(crypto.id);
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

        {cryptos?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>No crypto holdings yet.</p>
            <p className="text-sm">Click "Add Crypto Holding" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
