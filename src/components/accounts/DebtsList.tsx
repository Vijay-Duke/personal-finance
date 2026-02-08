import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, CreditCard, Banknote, GraduationCap, Car, Landmark, Stethoscope, FileText, PartyPopper, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '../ui/PageHeader';
import { PageFooter } from '../ui/PageFooter';
import { SectionHeader } from '../ui/SectionHeader';
import { cn } from '@/lib/utils';

// Design system: Debt asset color is Warm Clay
const DEBT_CLAY = '#b07060';

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

const getDebtTypeIcon = (type: string) => {
  switch (type) {
    case 'mortgage': return Home;
    case 'credit_card': return CreditCard;
    case 'personal_loan': return Banknote;
    case 'student_loan': return GraduationCap;
    case 'car_loan': return Car;
    case 'heloc': return Landmark;
    case 'medical_debt': return Stethoscope;
    default: return FileText;
  }
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

const getUtilizationColor = (utilization: number) => {
  if (utilization < 30) return 'var(--color-success)';
  if (utilization < 50) return 'var(--color-warning)';
  if (utilization < 75) return DEBT_CLAY;
  return 'var(--color-danger)';
};

const getUtilizationTextColor = (utilization: number) => {
  if (utilization < 30) return 'var(--color-success)';
  if (utilization < 50) return 'var(--color-warning)';
  if (utilization < 75) return DEBT_CLAY;
  return 'var(--color-danger)';
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
        <PageHeader label="OBLIGATIONS" title="Debt Overview" />
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
        <PageHeader label="OBLIGATIONS" title="Debt Overview" />
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

  const totalDebt = debts?.reduce((sum, d) => sum + d.currentBalance, 0) || 0;
  const totalMinPayment = debts?.reduce((sum, d) => sum + (d.minimumPayment || 0), 0) || 0;
  const avgInterestRate = debts?.length
    ? debts.reduce((sum, d) => sum + (d.interestRate || 0), 0) / debts.filter(d => d.interestRate).length
    : 0;

  const isRevolvingType = ['credit_card', 'heloc'].includes(formData.debtType);

  return (
    <div className="space-y-16">
      {/* Hero Header */}
      <PageHeader label="OBLIGATIONS" title="Debt Overview">
        <div className="hero-number">{formatCurrency(totalDebt, 'USD')}</div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Across {debts?.length || 0} obligation{(debts?.length || 0) !== 1 ? 's' : ''}
        </p>
      </PageHeader>

      {/* Summary Stats */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="section-label mb-2">TOTAL DEBT</p>
            <div className="font-display text-2xl font-light tabular-nums" style={{ color: DEBT_CLAY }}>
              {formatCurrency(totalDebt, 'USD')}
            </div>
          </div>
          <div className="text-center">
            <p className="section-label mb-2">MONTHLY MINIMUM</p>
            <div className="font-display text-2xl font-light text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(totalMinPayment, 'USD')}
            </div>
          </div>
          <div className="text-center">
            <p className="section-label mb-2">AVG INTEREST RATE</p>
            <div className="font-display text-2xl font-light text-[var(--color-text-primary)] tabular-nums">
              {avgInterestRate ? `${(avgInterestRate * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </Card>

      {/* Debts Section */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <SectionHeader label="YOUR OBLIGATIONS" title="Overview" />
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-[18px] h-[18px]" /> Add Debt
            </Button>
          )}
        </div>

        {/* Add Debt Form */}
        {showAddForm && (
          <Card>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
              New Obligation
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 -mt-4">
              Track mortgages, loans, and credit cards
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                      style={{
                        backgroundColor: 'var(--color-input-bg)',
                        borderColor: 'var(--color-input-border)',
                        color: 'var(--color-text-primary)',
                      }}
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

              {/* Balance Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-[var(--color-text-primary)]">Balance & Terms</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <h4 className="font-medium text-[var(--color-text-primary)]">Payment Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="h-4 w-4 rounded"
                    style={{ borderColor: 'var(--color-input-border)' }}
                  />
                  <Label htmlFor="autopayEnabled">Autopay enabled</Label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Debt'}
                </Button>
              </div>
              {createMutation.error && (
                <p className="text-[var(--color-danger)] text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </Card>
        )}

        {/* Debts List -- Zen Style */}
        <div className="space-y-0">
          {debts?.map((debt, index) => {
            const IconComponent = getDebtTypeIcon(debt.debtType);
            const hasProgress = debt.originalBalance && !debt.creditLimit;
            const progressPercent = hasProgress ? Math.min(debt.paidOffPercent || 0, 100) : 0;

            return (
              <a
                key={debt.id}
                href={`/accounts/${debt.id}`}
                className={cn(
                  'group block py-5 border-b border-border transition-colors',
                  'hover:bg-surface-elevated/50',
                  !debt.isActive && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Icon -- Warm Clay per design system */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${DEBT_CLAY}15`, color: DEBT_CLAY }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-text-primary truncate">
                          {debt.name}
                        </h3>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {debt.lender || getDebtTypeLabel(debt.debtType)}
                          {debt.autopayEnabled && <span className="text-success ml-2">· Autopay</span>}
                          {debt.paymentDueDay && <span className="text-text-muted ml-2">· Due {debt.paymentDueDay}th</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-semibold tabular-nums" style={{ color: DEBT_CLAY }}>
                          {formatCurrency(debt.currentBalance, debt.currency)}
                        </div>
                        {debt.interestRate && (
                          <p className="text-xs text-text-muted">
                            {(debt.interestRate * 100).toFixed(1)}% APR
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar (for loans) -- subtle */}
                    {hasProgress && progressPercent > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1 bg-bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-success transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-success tabular-nums">{progressPercent.toFixed(0)}% paid</span>
                      </div>
                    )}
                  </div>

                  {/* Chevron + Delete */}
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this debt?')) {
                          deleteMutation.mutate(debt.id);
                        }
                      }}
                      className="p-2 text-text-muted hover:text-danger transition-colors"
                      aria-label={`Delete ${debt.name}`}
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
          {debts?.length === 0 && !showAddForm && (
            <div className="flex flex-col items-center py-16 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                <PartyPopper className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Debt-free</h3>
              <p className="mt-2 text-sm text-text-secondary max-w-[400px] text-center">
                No obligations tracked yet. Add debts to keep your financial picture complete.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="mt-6 gap-2">
                <Plus className="w-4 h-4" /> Add First Obligation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <PageFooter
        icon={<CreditCard className="w-5 h-5" />}
        label="YOUR OBLIGATIONS"
        quote="The borrower is servant to the lender."
      />
    </div>
  );
}
