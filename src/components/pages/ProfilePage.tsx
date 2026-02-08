import { PageWrapper } from '@/components/PageWrapper';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { FinancialProfileSettings } from '@/components/profile/FinancialProfileSettings';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFooter } from '@/components/ui/PageFooter';
import { User } from 'lucide-react';

export function ProfilePage() {
  return (
    <PageWrapper>
      <div className="space-y-16">
        <PageHeader label="PROFILE" title="Your Account" />
        <AccountSettings />
        <FinancialProfileSettings />
        <PageFooter
          icon={<User className="w-5 h-5" />}
          label="YOUR PROFILE"
          quote="Know thyself, and thy finances shall follow."
        />
      </div>
    </PageWrapper>
  );
}
