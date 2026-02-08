import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { Search, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface HouseholdSummary {
  id: string;
  name: string;
  primaryCurrency: string;
  isActive: boolean;
  createdAt: string;
  memberCount: number;
}

export function AdminHouseholdList() {
  const { data: households, isLoading } = useApiQuery<HouseholdSummary[]>(
    queryKeys.adminHouseholds,
    '/api/admin/households'
  );
  const [search, setSearch] = useState('');

  const toggleMutation = useApiMutation<void, { id: string; isActive: boolean }>(
    ({ id, isActive }) =>
      fetch(`/api/admin/households/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to update household');
      }),
    { invalidateKeys: [queryKeys.adminHouseholds] }
  );

  const filtered = households?.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.id.includes(search)
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Households ({households?.length || 0})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search households..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-12 rounded bg-bg-surface" />
            <div className="h-12 rounded bg-bg-surface" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">No households found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((household) => (
              <div
                key={household.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border border-border-subtle p-3',
                  !household.isActive && 'opacity-60'
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{household.name}</p>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                    <span>{household.memberCount} member{household.memberCount !== 1 ? 's' : ''}</span>
                    <span className="text-border">|</span>
                    <span>{household.primaryCurrency}</span>
                    <span className="text-border">|</span>
                    <span>{new Date(household.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    toggleMutation.mutate({
                      id: household.id,
                      isActive: !household.isActive,
                    })
                  }
                  className={cn(
                    'h-8 px-2',
                    household.isActive ? 'text-success' : 'text-danger'
                  )}
                  title={household.isActive ? 'Disable household' : 'Enable household'}
                >
                  {household.isActive ? (
                    <ToggleRight className="h-5 w-5" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
