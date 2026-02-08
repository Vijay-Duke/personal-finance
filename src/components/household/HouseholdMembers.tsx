import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { UserMinus, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
}

const roleBadge: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Admin', className: 'bg-primary-100 text-primary-700' },
  owner: { label: 'Owner', className: 'bg-accent-100 text-accent-700' },
  member: { label: 'Member', className: 'bg-bg-surface text-text-muted' },
};

export function HouseholdMembers() {
  const { user: currentUser, isOwner } = useCurrentUser();
  const { data: members, isLoading } = useApiQuery<Member[]>(
    queryKeys.householdMembers,
    '/api/household/members'
  );

  const removeMutation = useApiMutation<void, string>(
    (memberId) =>
      fetch(`/api/household/members/${memberId}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error('Failed to remove member');
      }),
    { invalidateKeys: [queryKeys.householdMembers] }
  );

  const updateRoleMutation = useApiMutation<void, { id: string; role: string }>(
    ({ id, role }) =>
      fetch(`/api/household/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to update role');
      }),
    { invalidateKeys: [queryKeys.householdMembers] }
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            <div className="h-10 rounded bg-bg-surface" />
            <div className="h-10 rounded bg-bg-surface" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members ({members?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="space-y-3">
          {members?.map((member) => {
            const badge = roleBadge[member.role] || roleBadge.member;
            const isCurrentUser = member.id === currentUser?.id;
            const canManage = isOwner && !isCurrentUser && member.role !== 'super_admin';

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {member.image ? (
                    <img src={member.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                      {(member.name?.[0] || member.email[0]).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {member.name || member.email}
                      {isCurrentUser && <span className="text-text-muted ml-1">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-text-muted">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', badge.className)}>
                    {badge.label}
                  </span>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateRoleMutation.mutate({
                            id: member.id,
                            role: member.role === 'owner' ? 'member' : 'owner',
                          })
                        }
                        title={member.role === 'owner' ? 'Demote to member' : 'Promote to owner'}
                        className="h-7 w-7 p-0"
                      >
                        {member.role === 'owner' ? (
                          <User className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remove ${member.name || member.email} from the household?`)) {
                            removeMutation.mutate(member.id);
                          }
                        }}
                        aria-label="Remove member"
                        className="h-7 w-7 p-0 text-danger hover:text-danger"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
