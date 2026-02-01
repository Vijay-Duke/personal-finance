import { PageWrapper } from '@/components/PageWrapper';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { FinancialProfileSettings } from '@/components/profile/FinancialProfileSettings';

export function ProfilePage() {
  return (
    <PageWrapper>
      <div className="space-y-6">
        <AccountSettings />
        <FinancialProfileSettings />
      </div>
    </PageWrapper>
  );
}
