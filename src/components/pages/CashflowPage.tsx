import { PageWrapper } from '@/components/PageWrapper';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { SpendingChart } from '@/components/cashflow/SpendingChart';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFooter } from '@/components/ui/PageFooter';
import { DollarSign } from 'lucide-react';

interface CashflowPageProps {
  months?: number;
}

export function CashflowPage({ months = 6 }: CashflowPageProps) {
  return (
    <PageWrapper>
      <div className="space-y-16">
        <PageHeader label="CASHFLOW" title="Money In Motion" />
        <SpendingChart months={months} />
        <TransactionsList />
        <PageFooter
          icon={<DollarSign className="w-5 h-5" />}
          label="YOUR CASHFLOW"
          quote="Do not save what is left after spending, but spend what is left after saving."
        />
      </div>
    </PageWrapper>
  );
}
