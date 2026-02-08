import { HouseholdDetails } from './HouseholdDetails';
import { HouseholdMembers } from './HouseholdMembers';
import { HouseholdInvites } from './HouseholdInvites';
import { HouseholdDangerZone } from './HouseholdDangerZone';
import { HouseholdActivity } from './HouseholdActivity';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function HouseholdManagement() {
  const { isOwner } = useCurrentUser();

  return (
    <div className="space-y-6">
      <SectionHeader label="Settings" title="Household" />
      <HouseholdDetails />
      <HouseholdMembers />
      {isOwner && <HouseholdInvites />}
      <HouseholdActivity />
      <HouseholdDangerZone />
    </div>
  );
}
