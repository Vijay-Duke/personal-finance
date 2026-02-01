import { PageWrapper } from '@/components/PageWrapper';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { SpendingChart } from '@/components/cashflow/SpendingChart';

interface CashflowPageProps {
  months?: number;
}

export function CashflowPage({ months = 6 }: CashflowPageProps) {
  return (
    <PageWrapper>
      <div className="space-y-6">
        <SpendingChart months={months} />
        <TransactionsList />
      </div>
    </PageWrapper>
  );
}
