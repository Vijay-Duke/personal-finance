import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface BusinessAsset {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  businessAssetId: string;
  assetType: string;
  businessName: string | null;
  entityType: string | null;
  ein: string | null;
  stateOfFormation: string | null;
  dateFormed: Date | null;
  industry: string | null;
  ownershipPercentage: number | null;
  shareCount: number | null;
  totalShares: number | null;
  shareClass: string | null;
  vestingSchedule: string | null;
  fullyVestedDate: Date | null;
  purchasePrice: number | null;
  currentEstimatedValue: number | null;
  lastValuationDate: Date | null;
  lastValuationMethod: string | null;
  annualRevenue: number | null;
  annualDistributions: number | null;
  ownershipValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface AddAssetFormData {
  name: string;
  assetType: string;
  businessName: string;
  entityType: string;
  industry: string;
  ownershipPercentage: string;
  purchasePrice: string;
  currentEstimatedValue: string;
  annualRevenue: string;
  annualDistributions: string;
  shareCount: string;
  totalShares: string;
  shareClass: string;
  currency: string;
}

const initialFormData: AddAssetFormData = {
  name: '',
  assetType: 'business_ownership',
  businessName: '',
  entityType: 'llc',
  industry: '',
  ownershipPercentage: '',
  purchasePrice: '',
  currentEstimatedValue: '',
  annualRevenue: '',
  annualDistributions: '',
  shareCount: '',
  totalShares: '',
  shareClass: 'common',
  currency: 'USD',
};

export function BusinessAssetsList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddAssetFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: assets, isLoading, error } = useQuery<BusinessAsset[]>({
    queryKey: ['accounts', 'business-assets'],
    queryFn: async () => {
      const res = await fetch('/api/accounts/business-assets');
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddAssetFormData) => {
      const res = await fetch('/api/accounts/business-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          assetType: data.assetType,
          businessName: data.businessName || undefined,
          entityType: data.entityType || undefined,
          industry: data.industry || undefined,
          ownershipPercentage: parseFloat(data.ownershipPercentage) || undefined,
          purchasePrice: parseFloat(data.purchasePrice) || undefined,
          currentEstimatedValue: parseFloat(data.currentEstimatedValue) || undefined,
          annualRevenue: parseFloat(data.annualRevenue) || undefined,
          annualDistributions: parseFloat(data.annualDistributions) || undefined,
          shareCount: parseInt(data.shareCount) || undefined,
          totalShares: parseInt(data.totalShares) || undefined,
          shareClass: data.shareClass || undefined,
          currency: data.currency,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create asset');
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
      if (!res.ok) throw new Error('Failed to delete asset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      business_ownership: 'Business Ownership',
      partnership: 'Partnership',
      llc_membership: 'LLC Membership',
      stock_options: 'Stock Options',
      rsu: 'RSUs',
      equity: 'Private Equity',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sole_proprietorship: 'Sole Proprietorship',
      llc: 'LLC',
      s_corp: 'S Corporation',
      c_corp: 'C Corporation',
      partnership: 'Partnership',
      lp: 'Limited Partnership',
    };
    return labels[type] || type;
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
        <p className="text-red-600">Error loading assets</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const totalValue = assets?.reduce((sum, a) => sum + a.ownershipValue, 0) || 0;
  const totalDistributions = assets?.reduce((sum, a) => sum + (a.annualDistributions || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Business Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue, 'USD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalDistributions, 'USD')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Asset Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Business Asset</CardTitle>
            <CardDescription>Track business ownership and equity stakes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Investment Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., TechStartup Inc. Equity"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assetType">Asset Type *</Label>
                  <select
                    id="assetType"
                    name="assetType"
                    value={formData.assetType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="business_ownership">Business Ownership</option>
                    <option value="partnership">Partnership Interest</option>
                    <option value="llc_membership">LLC Membership</option>
                    <option value="stock_options">Stock Options</option>
                    <option value="rsu">RSUs</option>
                    <option value="equity">Private Equity</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type</Label>
                  <select
                    id="entityType"
                    name="entityType"
                    value={formData.entityType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="sole_proprietorship">Sole Proprietorship</option>
                    <option value="llc">LLC</option>
                    <option value="s_corp">S Corporation</option>
                    <option value="c_corp">C Corporation</option>
                    <option value="partnership">Partnership</option>
                    <option value="lp">Limited Partnership</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="USD">USD</option>
                    <option value="AUD">AUD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Ownership</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownershipPercentage">Ownership (%)</Label>
                    <Input
                      id="ownershipPercentage"
                      name="ownershipPercentage"
                      type="number"
                      step="0.01"
                      value={formData.ownershipPercentage}
                      onChange={handleInputChange}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shareCount">Shares Owned</Label>
                    <Input
                      id="shareCount"
                      name="shareCount"
                      type="number"
                      value={formData.shareCount}
                      onChange={handleInputChange}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalShares">Total Shares</Label>
                    <Input
                      id="totalShares"
                      name="totalShares"
                      type="number"
                      value={formData.totalShares}
                      onChange={handleInputChange}
                      placeholder="100000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Valuation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Cost Basis</Label>
                    <Input
                      id="purchasePrice"
                      name="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentEstimatedValue">Current Value *</Label>
                    <Input
                      id="currentEstimatedValue"
                      name="currentEstimatedValue"
                      type="number"
                      value={formData.currentEstimatedValue}
                      onChange={handleInputChange}
                      placeholder="100000"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Income</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annualRevenue">Annual Revenue</Label>
                    <Input
                      id="annualRevenue"
                      name="annualRevenue"
                      type="number"
                      value={formData.annualRevenue}
                      onChange={handleInputChange}
                      placeholder="500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualDistributions">Annual Distributions</Label>
                    <Input
                      id="annualDistributions"
                      name="annualDistributions"
                      type="number"
                      value={formData.annualDistributions}
                      onChange={handleInputChange}
                      placeholder="20000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Asset'}
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
          + Add Business Asset
        </Button>
      )}

      {/* Assets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assets?.map(asset => (
          <Card key={asset.id} className={cn(!asset.isActive && 'opacity-50')}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏢</span>
                  <div>
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <CardDescription>
                      {asset.businessName || getAssetTypeLabel(asset.assetType)}
                      {asset.entityType && ` · ${getEntityTypeLabel(asset.entityType)}`}
                    </CardDescription>
                  </div>
                </div>
                {asset.ownershipPercentage && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {asset.ownershipPercentage}% ownership
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Stake Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(asset.ownershipValue, asset.currency)}
                    </p>
                  </div>
                  {asset.gainLoss !== 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Gain/Loss</p>
                      <p className={cn('text-lg font-semibold', asset.gainLoss >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {asset.gainLoss >= 0 ? '+' : ''}
                        {formatCurrency(asset.gainLoss, asset.currency)}
                        <span className="text-sm ml-1">
                          ({asset.gainLoss >= 0 ? '+' : ''}{asset.gainLossPercent.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Share info */}
                {asset.shareCount && asset.totalShares && (
                  <div className="text-sm text-muted-foreground">
                    {asset.shareCount.toLocaleString()} of {asset.totalShares.toLocaleString()} shares
                    {asset.shareClass && ` (${asset.shareClass})`}
                  </div>
                )}

                {/* Industry */}
                {asset.industry && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Industry: </span>
                    <span>{asset.industry}</span>
                  </div>
                )}

                {/* Distributions */}
                {asset.annualDistributions && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Annual Distributions</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {formatCurrency(asset.annualDistributions, asset.currency)}/yr
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/accounts/${asset.id}`}>View Details</a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this asset?')) {
                        deleteMutation.mutate(asset.id);
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

        {assets?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🏢</p>
            <p>No business assets yet.</p>
            <p className="text-sm">Click "Add Business Asset" to track your business equity.</p>
          </div>
        )}
      </div>
    </div>
  );
}
