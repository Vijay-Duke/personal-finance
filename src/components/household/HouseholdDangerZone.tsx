import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { LogOut, ArrowRightLeft } from 'lucide-react';

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function HouseholdDangerZone() {
  const { user, isMember, isOwner } = useCurrentUser();
  const [selectedNewOwner, setSelectedNewOwner] = useState('');

  const { data: members } = useApiQuery<Member[]>(
    queryKeys.householdMembers,
    '/api/household/members',
    { enabled: isOwner }
  );

  const leaveMutation = useApiMutation<{ success: boolean }, void>(
    () =>
      fetch('/api/household/leave', { method: 'POST' }).then((r) => {
        if (!r.ok) throw new Error('Failed to leave household');
        return r.json();
      }),
    {
      invalidateKeys: [queryKeys.household, queryKeys.householdMembers, queryKeys.currentUser],
      onSuccess: () => {
        window.location.href = '/';
      },
    }
  );

  const transferMutation = useApiMutation<{ success: boolean }, string>(
    (newOwnerId) =>
      fetch('/api/household/transfer-ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      }).then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to transfer ownership');
        }
        return r.json();
      }),
    {
      invalidateKeys: [queryKeys.household, queryKeys.householdMembers, queryKeys.currentUser],
      onSuccess: () => {
        setSelectedNewOwner('');
      },
    }
  );

  if (!isMember && !isOwner) return null;

  const transferCandidates = members?.filter(
    (m) => m.id !== user?.id && m.role !== 'super_admin'
  ) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-danger">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent className="mt-4 space-y-6">
        {/* Transfer Ownership (owners only) */}
        {isOwner && transferCandidates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">Transfer Ownership</h4>
            <p className="text-sm text-text-muted mb-3">
              Hand off ownership to another member. You will become a regular member and can then leave the household.
            </p>
            <div className="flex gap-2">
              <select
                value={selectedNewOwner}
                onChange={(e) => setSelectedNewOwner(e.target.value)}
                className="flex-1 rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a member...</option>
                {transferCandidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedNewOwner) return;
                  const target = transferCandidates.find((m) => m.id === selectedNewOwner);
                  if (
                    confirm(
                      `Transfer ownership to ${target?.name || target?.email}? You will become a regular member.`
                    )
                  ) {
                    transferMutation.mutate(selectedNewOwner);
                  }
                }}
                disabled={!selectedNewOwner || transferMutation.isPending}
                className="border-danger text-danger hover:bg-danger/10"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
              </Button>
            </div>
            {transferMutation.error && (
              <p className="mt-2 text-sm text-danger">{transferMutation.error.message}</p>
            )}
          </div>
        )}

        {isOwner && transferCandidates.length === 0 && (
          <p className="text-sm text-text-muted">
            You are the only member. Invite others to transfer ownership before leaving.
          </p>
        )}

        {/* Leave Household (members only) */}
        {isMember && (
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">Leave Household</h4>
            <p className="text-sm text-text-muted mb-3">
              Leaving the household will remove your access to all shared financial data.
              This action cannot be undone.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to leave this household? You will lose access to all shared data.')) {
                  leaveMutation.mutate();
                }
              }}
              disabled={leaveMutation.isPending}
              className="border-danger text-danger hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {leaveMutation.isPending ? 'Leaving...' : 'Leave Household'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
