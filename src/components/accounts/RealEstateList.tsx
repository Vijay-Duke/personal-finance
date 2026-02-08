import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, Building2, Palmtree, Store, TreePine, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '../ui/PageHeader';
import { PageFooter } from '../ui/PageFooter';
import { SectionHeader } from '../ui/SectionHeader';
import { cn } from '@/lib/utils';

// Design system: Real Estate asset color is Muted Mauve
const RE_MAUVE = '#9b85a8';

interface RealEstateProperty {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  propertyId: string;
  propertyType: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  squareFootage: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  currentEstimatedValue: number | null;
  isRental: boolean;
  monthlyRentIncome: number | null;
  occupancyRate: number | null;
  annualPropertyTax: number | null;
  annualInsurance: number | null;
  monthlyHOA: number | null;
  annualMaintenance: number | null;
  linkedMortgageId: string | null;
  equity: number;
  annualRentIncome: number;
  totalAnnualExpenses: number;
}

interface AddPropertyFormData {
  name: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  squareFootage: string;
  bedrooms: string;
  bathrooms: string;
  yearBuilt: string;
  purchasePrice: string;
  currentEstimatedValue: string;
  isRental: boolean;
  monthlyRentIncome: string;
  annualPropertyTax: string;
  annualInsurance: string;
  monthlyHOA: string;
  currency: string;
}

const initialFormData: AddPropertyFormData = {
  name: '',
  propertyType: 'primary_residence',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  squareFootage: '',
  bedrooms: '',
  bathrooms: '',
  yearBuilt: '',
  purchasePrice: '',
  currentEstimatedValue: '',
  isRental: false,
  monthlyRentIncome: '',
  annualPropertyTax: '',
  annualInsurance: '',
  monthlyHOA: '',
  currency: 'USD',
};

const getPropertyTypeIcon = (type: string) => {
  switch (type) {
    case 'primary_residence': return Home;
    case 'investment': return Building2;
    case 'vacation': return Palmtree;
    case 'commercial': return Store;
    case 'land': return TreePine;
    default: return Home;
  }
};

const getPropertyTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    primary_residence: 'Primary Residence',
    investment: 'Investment Property',
    vacation: 'Vacation Home',
    commercial: 'Commercial',
    land: 'Land',
  };
  return labels[type] || type;
};

export function RealEstateList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddPropertyFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: properties, isLoading, error } = useQuery<RealEstateProperty[]>({
    queryKey: ['accounts', 'real-estate'],
    queryFn: async () => {
      const res = await fetch('/api/accounts/real-estate');
      if (!res.ok) throw new Error('Failed to fetch properties');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddPropertyFormData) => {
      const res = await fetch('/api/accounts/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          propertyType: data.propertyType,
          address: data.address || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          postalCode: data.postalCode || undefined,
          country: data.country,
          squareFootage: parseInt(data.squareFootage) || undefined,
          bedrooms: parseInt(data.bedrooms) || undefined,
          bathrooms: parseFloat(data.bathrooms) || undefined,
          yearBuilt: parseInt(data.yearBuilt) || undefined,
          purchasePrice: parseFloat(data.purchasePrice) || undefined,
          currentEstimatedValue: parseFloat(data.currentEstimatedValue) || undefined,
          isRental: data.isRental,
          monthlyRentIncome: data.isRental ? parseFloat(data.monthlyRentIncome) || undefined : undefined,
          annualPropertyTax: parseFloat(data.annualPropertyTax) || undefined,
          annualInsurance: parseFloat(data.annualInsurance) || undefined,
          monthlyHOA: parseFloat(data.monthlyHOA) || undefined,
          currency: data.currency,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create property');
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
      if (!res.ok) throw new Error('Failed to delete property');
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
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading -- skeleton shimmer per design system
  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="REAL ESTATE" title="Property Holdings" />
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
        <PageHeader label="REAL ESTATE" title="Property Holdings" />
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

  const totalValue = properties?.reduce((sum, p) => sum + (p.currentEstimatedValue || p.currentBalance), 0) || 0;
  const totalEquity = properties?.reduce((sum, p) => sum + p.equity, 0) || 0;
  const totalRentIncome = properties?.reduce((sum, p) => sum + p.annualRentIncome, 0) || 0;

  return (
    <div className="space-y-16">
      {/* Hero Header */}
      <PageHeader label="REAL ESTATE" title="Property Holdings">
        <div className="hero-number">{formatCurrency(totalValue, 'USD')}</div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Across {properties?.length || 0} propert{(properties?.length || 0) !== 1 ? 'ies' : 'y'}
        </p>
      </PageHeader>

      {/* Summary Stats */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="section-label mb-2">TOTAL VALUE</p>
            <div className="font-display text-2xl font-light text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(totalValue, 'USD')}
            </div>
          </div>
          <div className="text-center">
            <p className="section-label mb-2">TOTAL EQUITY</p>
            <div className="font-display text-2xl font-light tabular-nums" style={{ color: RE_MAUVE }}>
              {formatCurrency(totalEquity, 'USD')}
            </div>
          </div>
          <div className="text-center">
            <p className="section-label mb-2">ANNUAL RENT INCOME</p>
            <div className="font-display text-2xl font-light text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(totalRentIncome, 'USD')}
            </div>
          </div>
        </div>
      </Card>

      {/* Properties Section */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <SectionHeader label="YOUR PROPERTIES" title="Overview" />
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-[18px] h-[18px]" /> Add Property
            </Button>
          )}
        </div>

        {/* Add Property Form */}
        {showAddForm && (
          <Card>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
              New Property
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 -mt-4">
              Track your property values and rental income
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-[var(--color-text-primary)]">Property Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Residence, Beach House"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                      style={{
                        backgroundColor: 'var(--color-input-bg)',
                        borderColor: 'var(--color-input-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <option value="primary_residence">Primary Residence</option>
                      <option value="investment">Investment Property</option>
                      <option value="vacation">Vacation Home</option>
                      <option value="commercial">Commercial</option>
                      <option value="land">Land</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h4 className="font-medium text-[var(--color-text-primary)]">Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="CA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="90210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                      style={{
                        backgroundColor: 'var(--color-input-bg)',
                        borderColor: 'var(--color-input-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <option value="US">United States</option>
                      <option value="AU">Australia</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Property Specifications */}
              <div className="space-y-4">
                <h4 className="font-medium text-[var(--color-text-primary)]">Property Specifications</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="squareFootage">Sq. Footage</Label>
                    <Input
                      id="squareFootage"
                      name="squareFootage"
                      type="number"
                      value={formData.squareFootage}
                      onChange={handleInputChange}
                      placeholder="2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      name="yearBuilt"
                      type="number"
                      value={formData.yearBuilt}
                      onChange={handleInputChange}
                      placeholder="2005"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-[var(--color-text-primary)]">Financial Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input
                      id="purchasePrice"
                      name="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      placeholder="500000"
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
                      placeholder="600000"
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
                      <option value="CAD">CAD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="space-y-4">
                <h4 className="font-medium text-[var(--color-text-primary)]">Annual Expenses</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annualPropertyTax">Property Tax (Annual)</Label>
                    <Input
                      id="annualPropertyTax"
                      name="annualPropertyTax"
                      type="number"
                      value={formData.annualPropertyTax}
                      onChange={handleInputChange}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualInsurance">Insurance (Annual)</Label>
                    <Input
                      id="annualInsurance"
                      name="annualInsurance"
                      type="number"
                      value={formData.annualInsurance}
                      onChange={handleInputChange}
                      placeholder="2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyHOA">HOA (Monthly)</Label>
                    <Input
                      id="monthlyHOA"
                      name="monthlyHOA"
                      type="number"
                      value={formData.monthlyHOA}
                      onChange={handleInputChange}
                      placeholder="300"
                    />
                  </div>
                </div>
              </div>

              {/* Rental Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRental"
                    name="isRental"
                    checked={formData.isRental}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded"
                    style={{ borderColor: 'var(--color-input-border)' }}
                  />
                  <Label htmlFor="isRental">This is a rental property</Label>
                </div>
                {formData.isRental && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyRentIncome">Monthly Rent Income</Label>
                      <Input
                        id="monthlyRentIncome"
                        name="monthlyRentIncome"
                        type="number"
                        value={formData.monthlyRentIncome}
                        onChange={handleInputChange}
                        placeholder="2500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Property'}
                </Button>
              </div>
              {createMutation.error && (
                <p className="text-[var(--color-danger)] text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </Card>
        )}

        {/* Properties List */}
        <div className="space-y-0">
          {properties?.map((property) => {
            const IconComponent = getPropertyTypeIcon(property.propertyType);
            return (
              <a
                key={property.id}
                href={`/accounts/${property.id}`}
                className={cn(
                  'group block py-5 border-b border-border transition-colors',
                  'hover:bg-surface-elevated/50',
                  !property.isActive && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Icon - 40px rounded */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${RE_MAUVE}15`, color: RE_MAUVE }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Content - name/details left, value right */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{property.name}</h3>
                        <p className="text-sm text-text-secondary">
                          {getPropertyTypeLabel(property.propertyType)}
                          {property.isRental && ' · Rental'}
                          {(property.city || property.state) && ` · ${property.city}${property.state ? `, ${property.state}` : ''}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-text-primary">
                          {formatCurrency(property.currentEstimatedValue || property.currentBalance, property.currency)}
                        </div>
                        {property.equity > 0 && (
                          <div className="text-sm text-success">
                            {formatCurrency(property.equity, property.currency)} equity
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
                        if (confirm('Are you sure you want to delete this property?')) {
                          deleteMutation.mutate(property.id);
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
          {properties?.length === 0 && !showAddForm && (
            <div className="flex flex-col items-center py-16 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                A blank canvas
              </h3>
              <p className="mt-2 text-[15px] text-[var(--color-text-secondary)] max-w-[400px] text-center">
                Begin tracking your properties to see your real estate holdings at a glance.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="mt-6 gap-2">
                <Plus className="w-[18px] h-[18px]" />
                Add Your First Property
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <PageFooter
        icon={<Home className="w-5 h-5" />}
        label="YOUR PROPERTY HOLDINGS"
        quote="Real estate cannot be lost or stolen, nor can it be carried away."
      />
    </div>
  );
}
