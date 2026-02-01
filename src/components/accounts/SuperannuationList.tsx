import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface SuperannuationAccount {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  superId: string;
  superType: string;
  fundName: string | null;
  memberNumber: string | null;
  employerContributionRate: number | null;
  employeeContributionRate: number | null;
  investmentOption: string | null;
  hasLifeInsurance: boolean;
  lifeInsuranceCover: number | null;
  preservationAge: number | null;
  taxFreeComponent: number | null;
  taxableComponent: number | null;
  preTaxBalance: number | null;
  totalContributionRate: number;
}

interface AddSuperFormData {
  name: string;
  superType: string;
  fundName: string;
  memberNumber: string;
  currentBalance: string;
  employerContributionRate: string;
  personalContributionRate: string;
  investmentOption: string;
  preservationAge: string;
  currency: string;
}

const initialFormData: AddSuperFormData = {
  name: '',
  superType: 'super_accumulation',
  fundName: '',
  memberNumber: '',
  currentBalance: '',
  employerContributionRate: '11.5',
  personalContributionRate: '',
  investmentOption: 'balanced',
  preservationAge: '60',
  currency: 'AUD',
};

export function SuperannuationList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddSuperFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, error } = useQuery<SuperannuationAccount[]>({
    queryKey: ['accounts', 'superannuation'],
    queryFn: async () => {
      const res = await fetch('/api/accounts/superannuation');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddSuperFormData) => {
      const res = await fetch('/api/accounts/superannuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          superType: data.superType,
          fundName: data.fundName || undefined,
          memberNumber: data.memberNumber || undefined,
          currentBalance: parseFloat(data.currentBalance) || 0,
          employerContributionRate: parseFloat(data.employerContributionRate) / 100 || undefined,
          personalContributionRate: parseFloat(data.personalContributionRate) / 100 || undefined,
          investmentOption: data.investmentOption || undefined,
          preservationAge: parseInt(data.preservationAge) || undefined,
          currency: data.currency,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create account');
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
      if (!res.ok) throw new Error('Failed to delete account');
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
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSuperTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      super_accumulation: 'Accumulation',
      super_pension: 'Account-Based Pension',
      smsf: 'Self-Managed (SMSF)',
      '401k': '401(k)',
      '403b': '403(b)',
      ira_traditional: 'Traditional IRA',
      ira_roth: 'Roth IRA',
      sep_ira: 'SEP IRA',
      simple_ira: 'SIMPLE IRA',
      pension_workplace: 'Workplace Pension',
      pension_personal: 'Personal Pension',
      sipp: 'SIPP',
      other_retirement: 'Other',
    };
    return labels[type] || type;
  };

  const getInvestmentOptionLabel = (option: string) => {
    const labels: Record<string, string> = {
      conservative: 'Conservative',
      balanced: 'Balanced',
      growth: 'Growth',
      high_growth: 'High Growth',
      custom: 'Custom Mix',
    };
    return labels[option] || option;
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
        <p className="text-red-600">Error loading accounts</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.currentBalance, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Total Superannuation</CardTitle>
            <CardDescription>Across all retirement accounts</CardDescription>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalBalance, 'AUD')}
          </div>
        </CardHeader>
      </Card>

      {/* Add Account Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Superannuation Account</CardTitle>
            <CardDescription>Track your retirement savings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., AustralianSuper"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="superType">Account Type</Label>
                  <select
                    id="superType"
                    name="superType"
                    value={formData.superType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <optgroup label="Australian">
                      <option value="super_accumulation">Accumulation</option>
                      <option value="super_pension">Account-Based Pension</option>
                      <option value="smsf">SMSF</option>
                    </optgroup>
                    <optgroup label="US">
                      <option value="401k">401(k)</option>
                      <option value="403b">403(b)</option>
                      <option value="ira_traditional">Traditional IRA</option>
                      <option value="ira_roth">Roth IRA</option>
                      <option value="sep_ira">SEP IRA</option>
                      <option value="simple_ira">SIMPLE IRA</option>
                    </optgroup>
                    <optgroup label="UK">
                      <option value="pension_workplace">Workplace Pension</option>
                      <option value="pension_personal">Personal Pension</option>
                      <option value="sipp">SIPP</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="other_retirement">Other</option>
                    </optgroup>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fundName">Fund Name</Label>
                  <Input
                    id="fundName"
                    name="fundName"
                    value={formData.fundName}
                    onChange={handleInputChange}
                    placeholder="e.g., AustralianSuper"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberNumber">Member Number</Label>
                  <Input
                    id="memberNumber"
                    name="memberNumber"
                    value={formData.memberNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance *</Label>
                  <Input
                    id="currentBalance"
                    name="currentBalance"
                    type="number"
                    value={formData.currentBalance}
                    onChange={handleInputChange}
                    placeholder="150000"
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
                    <option value="AUD">AUD</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Contributions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employerContributionRate">Employer Contribution (%)</Label>
                    <Input
                      id="employerContributionRate"
                      name="employerContributionRate"
                      type="number"
                      step="0.5"
                      value={formData.employerContributionRate}
                      onChange={handleInputChange}
                      placeholder="11.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personalContributionRate">Personal Contribution (%)</Label>
                    <Input
                      id="personalContributionRate"
                      name="personalContributionRate"
                      type="number"
                      step="0.5"
                      value={formData.personalContributionRate}
                      onChange={handleInputChange}
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Investment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investmentOption">Investment Option</Label>
                    <select
                      id="investmentOption"
                      name="investmentOption"
                      value={formData.investmentOption}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="balanced">Balanced</option>
                      <option value="growth">Growth</option>
                      <option value="high_growth">High Growth</option>
                      <option value="custom">Custom Mix</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preservationAge">Preservation Age</Label>
                    <Input
                      id="preservationAge"
                      name="preservationAge"
                      type="number"
                      value={formData.preservationAge}
                      onChange={handleInputChange}
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Account'}
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
          + Add Superannuation Account
        </Button>
      )}

      {/* Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {accounts?.map(account => (
          <Card key={account.id} className={cn(!account.isActive && 'opacity-50')}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <CardDescription>
                      {account.fundName || getSuperTypeLabel(account.superType)}
                    </CardDescription>
                  </div>
                </div>
                {account.memberNumber && (
                  <span className="text-xs text-muted-foreground">
                    #{account.memberNumber}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(account.currentBalance, account.currency)}
                </div>

                {/* Contribution Rates */}
                {(account.employerContributionRate || account.employeeContributionRate) && (
                  <div className="flex gap-4 text-sm">
                    {account.employerContributionRate && (
                      <div>
                        <span className="text-muted-foreground">Employer: </span>
                        <span>{(account.employerContributionRate * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    {account.employeeContributionRate && (
                      <div>
                        <span className="text-muted-foreground">Personal: </span>
                        <span>{(account.employeeContributionRate * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Investment Option */}
                {account.investmentOption && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Investment: </span>
                    <span>{getInvestmentOptionLabel(account.investmentOption)}</span>
                  </div>
                )}

                {/* Preservation Age */}
                {account.preservationAge && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Preservation Age: </span>
                    <span>{account.preservationAge}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/accounts/${account.id}`}>View Details</a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this account?')) {
                        deleteMutation.mutate(account.id);
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

        {accounts?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🏛️</p>
            <p>No superannuation accounts yet.</p>
            <p className="text-sm">Click "Add Superannuation Account" to track your retirement savings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
