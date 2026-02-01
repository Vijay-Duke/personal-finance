import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface Debt {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  debtId: string;
  debtType: string;
  lender: string | null;
  lenderAccountNumber: string | null;
  originalBalance: number | null;
  originationDate: Date | null;
  interestRate: number | null;
  isFixedRate: boolean;
  minimumPayment: number | null;
  paymentFrequency: string;
  paymentDueDay: number | null;
  autopayEnabled: boolean;
  termMonths: number | null;
  maturityDate: Date | null;
  creditLimit: number | null;
  availableCredit: number | null;
  linkedPropertyId: string | null;
  utilization: number | null;
  estimatedPayoffMonths: number | null;
  paidOff: number;
  paidOffPercent: number;
}

interface AddDebtFormData {
  name: string;
  debtType: string;
  lender: string;
  originalBalance: string;
  currentBalance: string;
  interestRate: string;
  minimumPayment: string;
  paymentDueDay: string;
  creditLimit: string;
  termMonths: string;
  currency: string;
  autopayEnabled: boolean;
}

const initialFormData: AddDebtFormData = {
  name: '',
  debtType: 'credit_card',
  lender: '',
  originalBalance: '',
  currentBalance: '',
  interestRate: '',
  minimumPayment: '',
  paymentDueDay: '',
  creditLimit: '',
  termMonths: '',
  currency: 'USD',
  autopayEnabled: false,
};

export function DebtsList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddDebtFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: debts, isLoading, error } = useQuery<Debt[]>({
    queryKey: ['accounts', 'debts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts/debts');
      if (!res.ok) throw new Error('Failed to fetch debts');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddDebtFormData) => {
      const isRevolvingCredit = ['credit_card', 'heloc'].includes(data.debtType);
      const res = await fetch('/api/accounts/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          debtType: data.debtType,
          lender: data.lender || undefined,
          originalBalance: parseFloat(data.originalBalance) || parseFloat(data.currentBalance) || 0,
          currentBalance: parseFloat(data.currentBalance) || 0,
          interestRate: parseFloat(data.interestRate) / 100 || undefined,
          minimumPayment: parseFloat(data.minimumPayment) || undefined,
          paymentDueDay: parseInt(data.paymentDueDay) || undefined,
          creditLimit: isRevolvingCredit ? parseFloat(data.creditLimit) || undefined : undefined,
          termMonths: !isRevolvingCredit ? parseInt(data.termMonths) || undefined : undefined,
          currency: data.currency,
          autopayEnabled: data.autopayEnabled,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create debt');
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
      if (!res.ok) throw new Error('Failed to delete debt');
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

  const getDebtTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mortgage: 'Mortgage',
      credit_card: 'Credit Card',
      personal_loan: 'Personal Loan',
      student_loan: 'Student Loan',
      car_loan: 'Car Loan',
      heloc: 'HELOC',
      medical_debt: 'Medical Debt',
      other: 'Other Debt',
    };
    return labels[type] || type;
  };

  const getDebtTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      mortgage: '🏠',
      credit_card: '💳',
      personal_loan: '💵',
      student_loan: '🎓',
      car_loan: '🚗',
      heloc: '🏦',
      medical_debt: '🏥',
      other: '📋',
    };
    return icons[type] || '📋';
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return 'bg-green-500';
    if (utilization < 50) return 'bg-yellow-500';
    if (utilization < 75) return 'bg-orange-500';
    return 'bg-red-500';
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
        <p className="text-red-600">Error loading debts</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const totalDebt = debts?.reduce((sum, d) => sum + d.currentBalance, 0) || 0;
  const totalMinPayment = debts?.reduce((sum, d) => sum + (d.minimumPayment || 0), 0) || 0;
  const avgInterestRate = debts?.length
    ? debts.reduce((sum, d) => sum + (d.interestRate || 0), 0) / debts.filter(d => d.interestRate).length
    : 0;

  const isRevolvingType = ['credit_card', 'heloc'].includes(formData.debtType);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebt, 'USD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Minimum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalMinPayment, 'USD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Interest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {avgInterestRate ? `${(avgInterestRate * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Debt Button / Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Debt</CardTitle>
            <CardDescription>Track mortgages, loans, and credit cards</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Debt Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Chase Sapphire, Home Mortgage"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="debtType">Debt Type *</Label>
                    <select
                      id="debtType"
                      name="debtType"
                      value={formData.debtType}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="mortgage">Mortgage</option>
                      <option value="personal_loan">Personal Loan</option>
                      <option value="student_loan">Student Loan</option>
                      <option value="car_loan">Car Loan</option>
                      <option value="heloc">HELOC</option>
                      <option value="medical_debt">Medical Debt</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lender">Lender/Bank</Label>
                    <Input
                      id="lender"
                      name="lender"
                      value={formData.lender}
                      onChange={handleInputChange}
                      placeholder="e.g., Chase, Wells Fargo"
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

              {/* Balance Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Balance & Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentBalance">Current Balance *</Label>
                    <Input
                      id="currentBalance"
                      name="currentBalance"
                      type="number"
                      value={formData.currentBalance}
                      onChange={handleInputChange}
                      placeholder="5000"
                      required
                    />
                  </div>
                  {!isRevolvingType && (
                    <div className="space-y-2">
                      <Label htmlFor="originalBalance">Original Balance</Label>
                      <Input
                        id="originalBalance"
                        name="originalBalance"
                        type="number"
                        value={formData.originalBalance}
                        onChange={handleInputChange}
                        placeholder="10000"
                      />
                    </div>
                  )}
                  {isRevolvingType && (
                    <div className="space-y-2">
                      <Label htmlFor="creditLimit">Credit Limit</Label>
                      <Input
                        id="creditLimit"
                        name="creditLimit"
                        type="number"
                        value={formData.creditLimit}
                        onChange={handleInputChange}
                        placeholder="15000"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate (APR %)</Label>
                    <Input
                      id="interestRate"
                      name="interestRate"
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={handleInputChange}
                      placeholder="19.99"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumPayment">Minimum Payment</Label>
                    <Input
                      id="minimumPayment"
                      name="minimumPayment"
                      type="number"
                      value={formData.minimumPayment}
                      onChange={handleInputChange}
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDueDay">Due Day (1-31)</Label>
                    <Input
                      id="paymentDueDay"
                      name="paymentDueDay"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.paymentDueDay}
                      onChange={handleInputChange}
                      placeholder="15"
                    />
                  </div>
                  {!isRevolvingType && (
                    <div className="space-y-2">
                      <Label htmlFor="termMonths">Term (months)</Label>
                      <Input
                        id="termMonths"
                        name="termMonths"
                        type="number"
                        value={formData.termMonths}
                        onChange={handleInputChange}
                        placeholder="360"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autopayEnabled"
                    name="autopayEnabled"
                    checked={formData.autopayEnabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="autopayEnabled">Autopay enabled</Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Debt'}
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
          + Add Debt
        </Button>
      )}

      {/* Debts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {debts?.map(debt => (
          <Card key={debt.id} className={cn(!debt.isActive && 'opacity-50')}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getDebtTypeIcon(debt.debtType)}</span>
                  <div>
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                    <CardDescription>
                      {debt.lender || getDebtTypeLabel(debt.debtType)}
                      {debt.autopayEnabled && ' · Autopay'}
                    </CardDescription>
                  </div>
                </div>
                {debt.paymentDueDay && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    Due: {debt.paymentDueDay}th
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Balance */}
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(debt.currentBalance, debt.currency)}
                    </p>
                  </div>
                  {debt.interestRate && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">APR</p>
                      <p className="text-lg font-semibold">
                        {(debt.interestRate * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Credit Utilization (for credit cards/HELOC) */}
                {debt.creditLimit && debt.utilization !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credit Utilization</span>
                      <span className={cn(
                        debt.utilization > 75 ? 'text-red-600' :
                        debt.utilization > 50 ? 'text-orange-600' :
                        debt.utilization > 30 ? 'text-yellow-600' :
                        'text-green-600'
                      )}>
                        {debt.utilization.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={cn('h-2 rounded-full', getUtilizationColor(debt.utilization))}
                        style={{ width: `${Math.min(debt.utilization, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(debt.availableCredit || 0, debt.currency)} available of {formatCurrency(debt.creditLimit, debt.currency)}
                    </p>
                  </div>
                )}

                {/* Payoff Progress (for loans) */}
                {debt.originalBalance && !debt.creditLimit && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid Off</span>
                      <span className="text-green-600">{debt.paidOffPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${Math.min(debt.paidOffPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(debt.paidOff, debt.currency)} paid of {formatCurrency(debt.originalBalance, debt.currency)}
                    </p>
                  </div>
                )}

                {/* Payment Info */}
                <div className="flex justify-between pt-2 border-t text-sm">
                  {debt.minimumPayment && (
                    <div>
                      <span className="text-muted-foreground">Min. Payment: </span>
                      <span className="font-medium">{formatCurrency(debt.minimumPayment, debt.currency)}</span>
                    </div>
                  )}
                  {debt.estimatedPayoffMonths && (
                    <div>
                      <span className="text-muted-foreground">Est. Payoff: </span>
                      <span className="font-medium">{debt.estimatedPayoffMonths} months</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/accounts/${debt.id}`}>View Details</a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this debt?')) {
                        deleteMutation.mutate(debt.id);
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

        {debts?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🎉</p>
            <p>No debts tracked yet.</p>
            <p className="text-sm">Click "Add Debt" to start tracking your liabilities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
