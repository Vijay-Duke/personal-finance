import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

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

  const getAssetTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      vehicle: '🚗',
      jewelry: '💎',
      art: '🎨',
      collectibles: '🏆',
      electronics: '💻',
      furniture: '🪑',
      other: '📦',
    };
    return icons[type] || '📦';
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

  const totalValue = assets?.reduce((sum, a) => sum + (a.currentEstimatedValue || a.currentBalance), 0) || 0;
  const isVehicle = formData.assetType === 'vehicle';

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Total Personal Assets</CardTitle>
            <CardDescription>Vehicles, collectibles, and valuables</CardDescription>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalValue, 'USD')}
          </div>
        </CardHeader>
      </Card>

      {/* Add Asset Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Personal Asset</CardTitle>
            <CardDescription>Track vehicles, collectibles, and other valuables</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  <h3 className="font-medium">Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <h3 className="font-medium">Valuation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          + Add Personal Asset
        </Button>
      )}

      {/* Assets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assets?.map(asset => (
          <Card key={asset.id} className={cn(!asset.isActive && 'opacity-50')}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getAssetTypeIcon(asset.assetType)}</span>
                  <div>
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <CardDescription>
                      {asset.make && asset.model
                        ? `${asset.year || ''} ${asset.make} ${asset.model}`.trim()
                        : getAssetTypeLabel(asset.assetType)}
                    </CardDescription>
                  </div>
                </div>
                {asset.condition && (
                  <span className={cn(
                    'text-xs px-2 py-1 rounded capitalize',
                    asset.condition === 'excellent' && 'bg-green-100 text-green-700',
                    asset.condition === 'good' && 'bg-blue-100 text-blue-700',
                    asset.condition === 'fair' && 'bg-yellow-100 text-yellow-700',
                    asset.condition === 'poor' && 'bg-red-100 text-red-700',
                  )}>
                    {asset.condition}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(asset.currentEstimatedValue || asset.currentBalance, asset.currency)}
                    </p>
                  </div>
                  {asset.depreciation !== 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Depreciation</p>
                      <p className={cn('text-lg font-semibold', asset.depreciation > 0 ? 'text-red-600' : 'text-green-600')}>
                        {asset.depreciation > 0 ? '-' : '+'}
                        {formatCurrency(Math.abs(asset.depreciation), asset.currency)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Vehicle-specific info */}
                {asset.assetType === 'vehicle' && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {asset.mileage && <span>{asset.mileage.toLocaleString()} miles</span>}
                    {asset.licensePlate && <span>Plate: {asset.licensePlate}</span>}
                  </div>
                )}

                {/* Location */}
                {asset.location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Location: </span>
                    <span>{asset.location}</span>
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
            <p className="text-4xl mb-2">🚗</p>
            <p>No personal assets yet.</p>
            <p className="text-sm">Click "Add Personal Asset" to track your valuables.</p>
          </div>
        )}
      </div>
    </div>
  );
}
