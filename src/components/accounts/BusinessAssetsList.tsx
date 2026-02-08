import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Briefcase, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '../ui/PageHeader';
import { PageFooter } from '../ui/PageFooter';
import { SectionHeader } from '../ui/SectionHeader';
import { cn } from '@/lib/utils';

// Design system: Business Assets color is Soft Plum
const BIZ_PLUM = '#a07eb0';

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

  // Loading — skeleton shimmer per design system
  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="BUSINESS ASSETS" title="Enterprise Value" />
        <div className="space-y-0">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-[72px] border-b border-border animate-[shimmer_1.8s_ease-in-out_infinite]"
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
        <PageHeader label="BUSINESS ASSETS" title="Enterprise Value" />
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

  const totalValue = assets?.reduce((sum, a) => sum + a.ownershipValue, 0) || 0;
  const totalDistributions = assets?.reduce((sum, a) => sum + (a.annualDistributions || 0), 0) || 0;
  const assetCount = assets?.length || 0;

  return (
    <div className="space-y-16">
      {/* Hero Header */}
      <PageHeader label="BUSINESS ASSETS" title="Enterprise Value">
        <div className="hero-number">{formatCurrency(totalValue, 'USD')}</div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Across {assetCount} asset{assetCount !== 1 ? 's' : ''}
        </p>
      </PageHeader>

      {/* Summary Stats */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="text-center">
            <p className="section-label mb-2">TOTAL BUSINESS VALUE</p>
            <div className="font-display text-2xl font-light text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(totalValue, 'USD')}
            </div>
          </div>
          <div className="text-center">
            <p className="section-label mb-2">ANNUAL DISTRIBUTIONS</p>
            <div className="font-display text-2xl font-light tabular-nums" style={{ color: BIZ_PLUM }}>
              {formatCurrency(totalDistributions, 'USD')}
            </div>
          </div>
        </div>
      </Card>

      {/* Assets Section */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <SectionHeader label="YOUR HOLDINGS" title="Overview" />
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-[18px] h-[18px]" />
              Add Asset
            </Button>
          )}
        </div>

        {/* Add Asset Form */}
        {showAddForm && (
          <Card>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
              New Business Asset
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
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
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
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
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="USD">USD</option>
                    <option value="AUD">AUD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-[var(--color-text-primary)]">Ownership</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <h3 className="font-medium text-[var(--color-text-primary)]">Valuation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <h3 className="font-medium text-[var(--color-text-primary)]">Income</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Asset'}
                </Button>
              </div>
              {createMutation.error && (
                <p className="text-[var(--color-danger)] text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </Card>
        )}

        {/* Assets List */}
        <div className="space-y-0">
          {assets?.map((asset) => (
            <a
              key={asset.id}
              href={`/accounts/${asset.id}`}
              className={cn(
                'group block py-5 border-b border-border transition-colors',
                'hover:bg-surface-elevated/50',
                !asset.isActive && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Icon - 40px rounded */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${BIZ_PLUM}15`, color: BIZ_PLUM }}
                >
                  <Building2 className="w-5 h-5" />
                </div>

                {/* Content - name/details left, value right */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">{asset.name}</h3>
                      <p className="text-sm text-text-secondary">
                        {asset.businessName || getAssetTypeLabel(asset.assetType)}
                        {asset.entityType && ` · ${getEntityTypeLabel(asset.entityType)}`}
                        {asset.ownershipPercentage && ` · ${asset.ownershipPercentage}% ownership`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-text-primary">
                        {formatCurrency(asset.ownershipValue, asset.currency)}
                      </div>
                      {asset.gainLoss !== 0 && (
                        <div className={cn('text-sm', asset.gainLoss >= 0 ? 'text-success' : 'text-danger')}>
                          {asset.gainLoss >= 0 ? '+' : ''}
                          {formatCurrency(asset.gainLoss, asset.currency)}
                          <span className="text-text-muted ml-1">
                            ({asset.gainLoss >= 0 ? '+' : ''}{asset.gainLossPercent.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions - hover reveal */}
                <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this asset?')) {
                        deleteMutation.mutate(asset.id);
                      }
                    }}
                    className="p-2 text-text-muted hover:text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </div>
            </a>
          ))}

          {/* Empty State */}
          {assetCount === 0 && !showAddForm && (
            <div className="flex flex-col items-center py-16 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                A blank canvas
              </h3>
              <p className="mt-2 text-[15px] text-[var(--color-text-secondary)] max-w-[400px] text-center">
                Begin tracking your business equity to see your enterprise value grow.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="mt-6 gap-2">
                <Plus className="w-[18px] h-[18px]" />
                Add Your First Asset
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <PageFooter
        icon={<Briefcase className="w-5 h-5" />}
        label="YOUR ENTERPRISE VALUE"
        quote="Business is not financial science, it's about trading, buying and selling."
      />
    </div>
  );
}
