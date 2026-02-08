import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, PiggyBank, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '../ui/PageHeader';
import { PageFooter } from '../ui/PageFooter';
import { SectionHeader } from '../ui/SectionHeader';
import { cn } from '@/lib/utils';

// Design system: Superannuation asset color is Sage
const SUPER_SAGE = '#5f8563';

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

  // Loading — skeleton shimmer per design system
  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="SUPERANNUATION" title="Retirement Savings" />
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
        <PageHeader label="SUPERANNUATION" title="Retirement Savings" />
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

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.currentBalance, 0) || 0;
  const accountCount = accounts?.length || 0;

  return (
    <div className="space-y-16">
      {/* Hero Header */}
      <PageHeader label="SUPERANNUATION" title="Retirement Savings">
        <div className="hero-number">{formatCurrency(totalBalance, 'AUD')}</div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Across {accountCount} account{accountCount !== 1 ? 's' : ''}
        </p>
      </PageHeader>

      {/* Accounts Section */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <SectionHeader label="YOUR ACCOUNTS" title="Overview" />
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-[18px] h-[18px]" />
              Add Account
            </Button>
          )}
        </div>

        {/* Add Account Form */}
        {showAddForm && (
          <Card>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
              New Superannuation Account
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
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
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="AUD">AUD</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-[var(--color-text-primary)]">Contributions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <h3 className="font-medium text-[var(--color-text-primary)]">Investment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investmentOption">Investment Option</Label>
                    <select
                      id="investmentOption"
                      name="investmentOption"
                      value={formData.investmentOption}
                      onChange={handleInputChange}
                      className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                      style={{
                        backgroundColor: 'var(--color-input-bg)',
                        borderColor: 'var(--color-input-border)',
                        color: 'var(--color-text-primary)',
                      }}
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

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Account'}
                </Button>
              </div>
              {createMutation.error && (
                <p className="text-[var(--color-danger)] text-sm">{createMutation.error.message}</p>
              )}
            </form>
          </Card>
        )}

        {/* Accounts List */}
        <div className="space-y-0">
          {accounts?.map((account) => (
            <a
              key={account.id}
              href={`/accounts/${account.id}`}
              className={cn(
                'group block py-5 border-b border-border transition-colors',
                'hover:bg-surface-elevated/50',
                !account.isActive && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Icon - 40px rounded */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${SUPER_SAGE}15`, color: SUPER_SAGE }}
                >
                  <Landmark className="w-5 h-5" />
                </div>

                {/* Content - name/details left, value right */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">{account.name}</h3>
                      <p className="text-sm text-text-secondary">
                        {account.fundName || getSuperTypeLabel(account.superType)}
                        {account.memberNumber && ` · #${account.memberNumber}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-text-primary">
                        {formatCurrency(account.currentBalance, account.currency)}
                      </div>
                      {(account.employerContributionRate || account.employeeContributionRate) && (
                        <div className="text-sm text-text-secondary">
                          {account.employerContributionRate && (
                            <span>Employer: {(account.employerContributionRate * 100).toFixed(1)}%</span>
                          )}
                          {account.employerContributionRate && account.employeeContributionRate && ' · '}
                          {account.employeeContributionRate && (
                            <span>Personal: {(account.employeeContributionRate * 100).toFixed(1)}%</span>
                          )}
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
                      if (confirm('Are you sure you want to delete this account?')) {
                        deleteMutation.mutate(account.id);
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
          {accountCount === 0 && !showAddForm && (
            <div className="flex flex-col items-center py-16 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                <PiggyBank className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                A blank canvas
              </h3>
              <p className="mt-2 text-[15px] text-[var(--color-text-secondary)] max-w-[400px] text-center">
                Begin tracking your retirement savings to watch your future grow mindfully.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="mt-6 gap-2">
                <Plus className="w-[18px] h-[18px]" />
                Add Your First Account
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <PageFooter
        icon={<PiggyBank className="w-5 h-5" />}
        label="YOUR RETIREMENT SAVINGS"
        quote="Compound interest is the eighth wonder of the world."
      />
    </div>
  );
}
