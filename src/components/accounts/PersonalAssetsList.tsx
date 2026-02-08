import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Gem, Palette, Box, Monitor, Sofa, CircleDot, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '../ui/PageHeader';
import { PageFooter } from '../ui/PageFooter';
import { SectionHeader } from '../ui/SectionHeader';
import { cn } from '@/lib/utils';

// Design system: Personal Assets color is Dusty Rose
const PERSONAL_ROSE = '#b07880';

interface PersonalAsset {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  assetId: string;
  assetType: string;
  make: string | null;
  model: string | null;
  year: number | null;
  serialNumber: string | null;
  vin: string | null;
  licensePlate: string | null;
  mileage: number | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  currentEstimatedValue: number | null;
  condition: string | null;
  location: string | null;
  depreciation: number;
  depreciationPercent: number;
}

interface AddAssetFormData {
  name: string;
  assetType: string;
  make: string;
  model: string;
  year: string;
  purchasePrice: string;
  currentEstimatedValue: string;
  condition: string;
  location: string;
  vin: string;
  licensePlate: string;
  mileage: string;
  currency: string;
}

const initialFormData: AddAssetFormData = {
  name: '',
  assetType: 'vehicle',
  make: '',
  model: '',
  year: '',
  purchasePrice: '',
  currentEstimatedValue: '',
  condition: 'good',
  location: '',
  vin: '',
  licensePlate: '',
  mileage: '',
  currency: 'USD',
};

const getAssetTypeIcon = (type: string) => {
  switch (type) {
    case 'vehicle': return Car;
    case 'jewelry': return Gem;
    case 'art': return Palette;
    case 'collectibles': return Box;
    case 'electronics': return Monitor;
    case 'furniture': return Sofa;
    default: return CircleDot;
  }
};

export function PersonalAssetsList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddAssetFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: assets, isLoading, error } = useQuery<PersonalAsset[]>({
    queryKey: ['accounts', 'personal-assets'],
    queryFn: async () => {
      const res = await fetch('/api/accounts/personal-assets');
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddAssetFormData) => {
      const res = await fetch('/api/accounts/personal-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          assetType: data.assetType,
          make: data.make || undefined,
          model: data.model || undefined,
          year: parseInt(data.year) || undefined,
          purchasePrice: parseFloat(data.purchasePrice) || undefined,
          currentEstimatedValue: parseFloat(data.currentEstimatedValue) || undefined,
          condition: data.condition || undefined,
          location: data.location || undefined,
          vin: data.assetType === 'vehicle' ? data.vin || undefined : undefined,
          licensePlate: data.assetType === 'vehicle' ? data.licensePlate || undefined : undefined,
          mileage: data.assetType === 'vehicle' ? parseInt(data.mileage) || undefined : undefined,
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
      vehicle: 'Vehicle',
      jewelry: 'Jewelry',
      art: 'Art',
      collectibles: 'Collectibles',
      electronics: 'Electronics',
      furniture: 'Furniture',
      other: 'Other',
    };
    return labels[type] || type;
  };

  // Loading — skeleton shimmer per design system
  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="PERSONAL ASSETS" title="Tangible Worth" />
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
        <PageHeader label="PERSONAL ASSETS" title="Tangible Worth" />
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

  const totalValue = assets?.reduce((sum, a) => sum + (a.currentEstimatedValue || a.currentBalance), 0) || 0;
  const assetCount = assets?.length || 0;
  const isVehicle = formData.assetType === 'vehicle';

  return (
    <div className="space-y-16">
      {/* Hero Header */}
      <PageHeader label="PERSONAL ASSETS" title="Tangible Worth">
        <div className="hero-number">{formatCurrency(totalValue, 'USD')}</div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Across {assetCount} asset{assetCount !== 1 ? 's' : ''}
        </p>
      </PageHeader>

      {/* Assets Section */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <SectionHeader label="YOUR ASSETS" title="Overview" />
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
              New Personal Asset
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., 2020 Toyota Camry"
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
                    <option value="vehicle">Vehicle</option>
                    <option value="jewelry">Jewelry</option>
                    <option value="art">Art</option>
                    <option value="collectibles">Collectibles</option>
                    <option value="electronics">Electronics</option>
                    <option value="furniture">Furniture</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make">Make/Brand</Label>
                  <Input
                    id="make"
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    placeholder="e.g., Toyota, Rolex"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g., Camry, Submariner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              {/* Vehicle-specific fields */}
              {isVehicle && (
                <div className="space-y-4">
                  <h3 className="font-medium text-[var(--color-text-primary)]">Vehicle Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN</Label>
                      <Input
                        id="vin"
                        name="vin"
                        value={formData.vin}
                        onChange={handleInputChange}
                        placeholder="Vehicle Identification Number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licensePlate">License Plate</Label>
                      <Input
                        id="licensePlate"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                        placeholder="ABC-1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Mileage</Label>
                      <Input
                        id="mileage"
                        name="mileage"
                        type="number"
                        value={formData.mileage}
                        onChange={handleInputChange}
                        placeholder="50000"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-medium text-[var(--color-text-primary)]">Valuation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input
                      id="purchasePrice"
                      name="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      placeholder="25000"
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
                      placeholder="20000"
                      required
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
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Home garage, Safe deposit box"
                />
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
          {assets?.map((asset) => {
            const IconComponent = getAssetTypeIcon(asset.assetType);
            return (
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
                    style={{ backgroundColor: `${PERSONAL_ROSE}15`, color: PERSONAL_ROSE }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Content - name/details left, value right */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{asset.name}</h3>
                        <p className="text-sm text-text-secondary">
                          {asset.make && asset.model
                            ? `${asset.year || ''} ${asset.make} ${asset.model}`.trim()
                            : getAssetTypeLabel(asset.assetType)}
                          {asset.condition && ` · ${asset.condition}`}
                          {asset.assetType === 'vehicle' && asset.mileage && ` · ${asset.mileage.toLocaleString()} miles`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-text-primary">
                          {formatCurrency(asset.currentEstimatedValue || asset.currentBalance, asset.currency)}
                        </div>
                        {asset.depreciation !== 0 && (
                          <div className={cn('text-sm', asset.depreciation > 0 ? 'text-danger' : 'text-success')}>
                            {asset.depreciation > 0 ? '-' : '+'}
                            {formatCurrency(Math.abs(asset.depreciation), asset.currency)}
                            <span className="text-text-muted ml-1">depreciation</span>
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
            );
          })}

          {/* Empty State */}
          {assetCount === 0 && !showAddForm && (
            <div className="flex flex-col items-center py-16 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                <Gem className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                A blank canvas
              </h3>
              <p className="mt-2 text-[15px] text-[var(--color-text-secondary)] max-w-[400px] text-center">
                Begin cataloguing your tangible possessions to see their collective worth.
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
        icon={<Gem className="w-5 h-5" />}
        label="YOUR TANGIBLE WORTH"
        quote="The things you own end up owning you."
      />
    </div>
  );
}
