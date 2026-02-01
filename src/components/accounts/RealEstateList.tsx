import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

  const getPropertyTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      primary_residence: '🏠',
      investment: '🏢',
      vacation: '🏖️',
      commercial: '🏬',
      land: '🌳',
    };
    return icons[type] || '🏠';
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
        <p className="text-red-600">Error loading properties</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const totalValue = properties?.reduce((sum, p) => sum + (p.currentEstimatedValue || p.currentBalance), 0) || 0;
  const totalEquity = properties?.reduce((sum, p) => sum + p.equity, 0) || 0;
  const totalRentIncome = properties?.reduce((sum, p) => sum + p.annualRentIncome, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Property Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue, 'USD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalEquity, 'USD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Rental Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalRentIncome, 'USD')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Property Button / Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Real Estate Property</CardTitle>
            <CardDescription>Track your property values and rental income</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <h3 className="font-medium">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="US">United States</option>
                      <option value="AU">Australia</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="font-medium">Property Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <h3 className="font-medium">Financial Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <h3 className="font-medium">Annual Expenses</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isRental">This is a rental property</Label>
                </div>
                {formData.isRental && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Property'}
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
          + Add Property
        </Button>
      )}

      {/* Properties List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {properties?.map(property => (
          <Card key={property.id} className={cn(!property.isActive && 'opacity-50')}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getPropertyTypeIcon(property.propertyType)}</span>
                  <div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription>
                      {getPropertyTypeLabel(property.propertyType)}
                      {property.isRental && ' · Rental'}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Address */}
                {(property.address || property.city) && (
                  <p className="text-sm text-muted-foreground">
                    {property.address && <span>{property.address}<br /></span>}
                    {property.city && `${property.city}, `}
                    {property.state} {property.postalCode}
                  </p>
                )}

                {/* Value & Equity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(property.currentEstimatedValue || property.currentBalance, property.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Equity</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(property.equity, property.currency)}
                    </p>
                  </div>
                </div>

                {/* Property Details */}
                {(property.bedrooms || property.bathrooms || property.squareFootage) && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {property.bedrooms && <span>{property.bedrooms} bed</span>}
                    {property.bathrooms && <span>{property.bathrooms} bath</span>}
                    {property.squareFootage && <span>{property.squareFootage.toLocaleString()} sqft</span>}
                  </div>
                )}

                {/* Rental Income */}
                {property.isRental && property.monthlyRentIncome && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {formatCurrency(property.monthlyRentIncome, property.currency)}/mo
                    </p>
                  </div>
                )}

                {/* Expenses Summary */}
                {property.totalAnnualExpenses > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Annual Expenses: </span>
                    <span className="text-red-600">{formatCurrency(property.totalAnnualExpenses, property.currency)}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/accounts/${property.id}`}>View Details</a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this property?')) {
                        deleteMutation.mutate(property.id);
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

        {properties?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🏠</p>
            <p>No properties yet.</p>
            <p className="text-sm">Click "Add Property" to track your real estate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
