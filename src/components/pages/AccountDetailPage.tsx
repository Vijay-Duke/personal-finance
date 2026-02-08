import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageWrapper } from '../PageWrapper';

interface AccountData {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  isLiquid: boolean;
  includeInNetWorth: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  details: Record<string, unknown> | null;
}

const TYPE_LABELS: Record<string, string> = {
  bank_account: 'Bank Account',
  stock: 'Stock Holding',
  crypto: 'Crypto Asset',
  real_estate: 'Real Estate',
  superannuation: 'Superannuation',
  personal_asset: 'Personal Asset',
  business_asset: 'Business Asset',
  debt: 'Debt',
};

const TYPE_ROUTES: Record<string, string> = {
  bank_account: '/accounts/bank',
  stock: '/accounts/stocks',
  crypto: '/accounts/crypto',
  real_estate: '/accounts/real-estate',
  superannuation: '/accounts/superannuation',
  personal_asset: '/accounts/personal-assets',
  business_asset: '/accounts/business-assets',
  debt: '/accounts/debts',
};

function formatCurrency(amount: number, currencyCode: string) {
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
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const DETAIL_LABELS: Record<string, string> = {
  bankName: 'Bank Name',
  accountType: 'Account Type',
  accountNumber: 'Account Number',
  routingNumber: 'Routing Number',
  interestRate: 'Interest Rate (APY)',
  symbol: 'Ticker Symbol',
  exchange: 'Exchange',
  securityName: 'Company Name',
  shares: 'Shares',
  avgCostBasis: 'Avg Cost Basis',
  totalCostBasis: 'Total Cost Basis',
  currentPrice: 'Current Price',
  marketValue: 'Market Value',
  unrealizedGain: 'Unrealized Gain',
  unrealizedGainPercent: 'Gain %',
  broker: 'Broker',
  dividendYield: 'Dividend Yield',
  coinId: 'Coin ID',
  coinSymbol: 'Symbol',
  coinName: 'Coin Name',
  quantity: 'Quantity',
  purchasePrice: 'Purchase Price',
  walletAddress: 'Wallet Address',
};

function formatDetailValue(key: string, value: unknown, currency: string): string {
  if (value === null || value === undefined) return '—';
  if (key === 'interestRate' || key === 'dividendYield') {
    return `${(Number(value) * 100).toFixed(2)}%`;
  }
  if (key === 'unrealizedGainPercent') {
    const num = Number(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  }
  if (['avgCostBasis', 'totalCostBasis', 'currentPrice', 'marketValue', 'unrealizedGain', 'purchasePrice'].includes(key)) {
    return formatCurrency(Number(value), currency);
  }
  if (key === 'accountNumber') {
    return `****${String(value)}`;
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

export function AccountDetailPage({ accountId }: { accountId: string | undefined }) {
  return (
    <PageWrapper>
      <AccountDetailContent accountId={accountId} />
    </PageWrapper>
  );
}

function AccountDetailContent({ accountId }: { accountId: string | undefined }) {
  const { data: account, isLoading, error } = useQuery<AccountData>({
    queryKey: ['account', accountId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${accountId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch account');
      }
      return res.json();
    },
    enabled: !!accountId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-center py-12">
          <p className="text-danger text-sm">
            {error instanceof Error ? error.message : 'Account not found'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/accounts'}>
            View All Accounts
          </Button>
        </div>
      </div>
    );
  }

  const backHref = TYPE_ROUTES[account.type] || '/accounts';
  const typeLabel = TYPE_LABELS[account.type] || account.type;

  // Filter out internal/meta fields from details
  const detailEntries = account.details
    ? Object.entries(account.details).filter(
        ([key]) => !['id', 'accountId', 'createdAt', 'updatedAt', 'logo'].includes(key) && DETAIL_LABELS[key]
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <a href={backHref}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{account.name}</CardTitle>
              <CardDescription className="mt-1">
                {typeLabel} &middot; {account.currency}
                {!account.isActive && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning">Inactive</span>
                )}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums text-text-primary">
                {formatCurrency(account.currentBalance, account.currency)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {detailEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {detailEntries.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-text-muted uppercase tracking-wider">
                    {DETAIL_LABELS[key]}
                  </dt>
                  <dd className={cn(
                    "mt-0.5 text-sm font-medium text-text-primary tabular-nums",
                    key === 'unrealizedGain' && Number(value) >= 0 && 'text-success',
                    key === 'unrealizedGain' && Number(value) < 0 && 'text-danger',
                  )}>
                    {formatDetailValue(key, value, account.currency)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-text-muted uppercase tracking-wider">Created</dt>
              <dd className="mt-0.5 text-sm text-text-primary">{formatDate(account.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted uppercase tracking-wider">Last Updated</dt>
              <dd className="mt-0.5 text-sm text-text-primary">{formatDate(account.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted uppercase tracking-wider">Include in Net Worth</dt>
              <dd className="mt-0.5 text-sm text-text-primary">{account.includeInNetWorth ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted uppercase tracking-wider">Liquid Asset</dt>
              <dd className="mt-0.5 text-sm text-text-primary">{account.isLiquid ? 'Yes' : 'No'}</dd>
            </div>
            {account.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-text-muted uppercase tracking-wider">Notes</dt>
                <dd className="mt-0.5 text-sm text-text-secondary">{account.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
