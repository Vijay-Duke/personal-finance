import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Wallet, PiggyBank, CreditCard, Building2, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '../ui/PageHeader';
import { PageFooter } from '../ui/PageFooter';
import { SectionHeader } from '../ui/SectionHeader';
import { cn } from '@/lib/utils';

// Design system: Cash/Bank asset color is Soft Teal
const BANK_TEAL = '#6ba3a0';

interface BankAccount {
  id: string;
  name: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  bankAccountId: string;
  bankName: string | null;
  accountType: string;
  accountNumber: string | null;
  interestRate: number | null;
  createdAt: Date;
}

interface AddAccountFormData {
  name: string;
  bankName: string;
  accountType: string;
  currency: string;
  currentBalance: string;
  accountNumber: string;
  interestRate: string;
}

const initialFormData: AddAccountFormData = {
  name: '',
  bankName: '',
  accountType: 'checking',
  currency: 'USD',
  currentBalance: '0',
  accountNumber: '',
  interestRate: '0',
};

function getAccountIcon(type: string) {
  switch (type) {
    case 'checking':
      return Wallet;
    case 'savings':
      return PiggyBank;
    case 'money_market':
      return Building2;
    case 'cd':
      return CreditCard;
    default:
      return Landmark;
  }
}

export function BankAccountsList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddAccountFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, error } = useQuery<BankAccount[]>({
    queryKey: ['accounts', 'bank'],
    queryFn: async () => {
      const res = await fetch('/api/accounts/bank');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddAccountFormData) => {
      const res = await fetch('/api/accounts/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          bankName: data.bankName || undefined,
          accountType: data.accountType,
          currency: data.currency,
          currentBalance: parseFloat(data.currentBalance) || 0,
          accountNumber: data.accountNumber || undefined,
          interestRate: parseFloat(data.interestRate) / 100 || 0,
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

  const formatCurrency = (amount: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      checking: 'Checking',
      savings: 'Savings',
      money_market: 'Money Market',
      cd: 'Certificate of Deposit',
      other: 'Other',
    };
    return labels[type] || type;
  };

  // Loading — skeleton shimmer per design system
  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="BANK ACCOUNTS" title="Liquid Reserves" />
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
        <PageHeader label="BANK ACCOUNTS" title="Liquid Reserves" />
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
      <PageHeader label="BANK ACCOUNTS" title="Liquid Reserves">
        <div className="hero-number">{formatCurrency(totalBalance, 'USD')}</div>
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
              New Bank Account
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Checking"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g., Chase, Bank of America"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleInputChange}
                    className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="money_market">Money Market</option>
                    <option value="cd">Certificate of Deposit</option>
                    <option value="other">Other</option>
                  </select>
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
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    name="currentBalance"
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number (last 4)</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (APY %)</Label>
                  <Input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
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

        {/* Accounts List — Zen List Style per DESIGN_SYSTEM.md 9.7 */}
        <div className="space-y-0">
          {accounts?.map((account, index) => {
            const IconComponent = getAccountIcon(account.accountType);
            return (
              <a
                key={account.id}
                href={`/accounts/${account.id}`}
                className={cn(
                  'group block py-5 border-b border-border transition-colors',
                  'hover:bg-surface-elevated/50',
                  !account.isActive && 'opacity-50'
                )}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon — Soft Teal per design system */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${BANK_TEAL}15`, color: BANK_TEAL }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-text-primary truncate">
                          {account.name}
                        </h3>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {account.bankName || 'Bank Account'} · {getAccountTypeLabel(account.accountType)}
                          {account.accountNumber && (
                            <span className="text-text-muted ml-2 font-mono">····{account.accountNumber}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-semibold text-text-primary tabular-nums">
                          {formatCurrency(account.currentBalance, account.currency)}
                        </div>
                        {account.interestRate != null && account.interestRate > 0 && (
                          <p className="text-xs text-success">
                            +{(account.interestRate * 100).toFixed(2)}% APY
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chevron + Delete */}
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this account?')) {
                          deleteMutation.mutate(account.id);
                        }
                      }}
                      className="p-2 text-text-muted hover:text-danger transition-colors"
                      aria-label={`Delete ${account.name}`}
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
          {accountCount === 0 && !showAddForm && (
            <div className="flex flex-col items-center py-16 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
                <Landmark className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                A blank canvas
              </h3>
              <p className="mt-2 text-sm text-text-secondary max-w-[400px] text-center">
                Begin tracking your bank accounts to see your liquid reserves at a glance.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="mt-6 gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Account
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <PageFooter
        icon={<Landmark className="w-5 h-5" />}
        label="YOUR LIQUID RESERVES"
        quote="Financial peace isn't about having more. It's about knowing enough."
      />
    </div>
  );
}
