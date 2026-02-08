import { useApiQuery, queryKeys } from '@/hooks/useApi';
import { AdminStatCard } from './AdminStatCard';
import { AdminSystemSettings } from './AdminSystemSettings';
import { AdminHouseholdList } from './AdminHouseholdList';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Home, Users, Wallet } from 'lucide-react';

interface AdminStats {
  households: number;
  users: number;
  accounts: number;
}

export function AdminDashboard() {
  const { data: stats } = useApiQuery<AdminStats>(
    queryKeys.adminStats,
    '/api/admin/stats'
  );

  return (
    <div className="space-y-6">
      <SectionHeader label="Admin" title="Instance Overview" />

      <div className="grid grid-cols-3 gap-3">
        <AdminStatCard
          icon={<Home className="h-5 w-5" />}
          label="Households"
          value={stats?.households ?? '...'}
        />
        <AdminStatCard
          icon={<Users className="h-5 w-5" />}
          label="Users"
          value={stats?.users ?? '...'}
        />
        <AdminStatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Accounts"
          value={stats?.accounts ?? '...'}
        />
      </div>

      <AdminSystemSettings />
      <AdminHouseholdList />
    </div>
  );
}
