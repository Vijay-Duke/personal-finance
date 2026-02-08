import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { Plus, Copy, Check, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Invite {
  id: string;
  code: string;
  assignedRole: string;
  maxUses: number;
  useCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export function HouseholdInvites() {
  const { data: invites, isLoading } = useApiQuery<Invite[]>(
    queryKeys.inviteCodes,
    '/api/invites'
  );
  const [showCreate, setShowCreate] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInHours, setExpiresInHours] = useState(0);
  const [assignedRole, setAssignedRole] = useState<'member' | 'owner'>('member');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createMutation = useApiMutation<Invite, void>(
    () =>
      fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxUses,
          expiresInHours: expiresInHours > 0 ? expiresInHours : undefined,
          assignedRole,
        }),
      }).then((r) => r.json()),
    {
      invalidateKeys: [queryKeys.inviteCodes],
      onSuccess: () => {
        setShowCreate(false);
        setMaxUses(1);
        setExpiresInHours(0);
      },
    }
  );

  const revokeMutation = useApiMutation<void, string>(
    (id) => fetch(`/api/invites/${id}`, { method: 'DELETE' }).then((r) => {
      if (!r.ok) throw new Error('Failed to revoke');
    }),
    { invalidateKeys: [queryKeys.inviteCodes] }
  );

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeInvites = invites?.filter((i) => !i.revokedAt) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Invite Codes</CardTitle>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-4 w-4 mr-1" />
            New Code
          </Button>
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        {showCreate && (
          <div className="mb-6 space-y-3 rounded-lg border border-border-subtle p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="max-uses">Max uses</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="expires">Expires in (hours)</Label>
                <Input
                  id="expires"
                  type="number"
                  min={0}
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="mt-1"
                  placeholder="0 = never"
                />
              </div>
            </div>
            <div>
              <Label>Assigned role</Label>
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  variant={assignedRole === 'member' ? 'default' : 'outline'}
                  onClick={() => setAssignedRole('member')}
                >
                  Member
                </Button>
                <Button
                  size="sm"
                  variant={assignedRole === 'owner' ? 'default' : 'outline'}
                  onClick={() => setAssignedRole('owner')}
                >
                  Owner
                </Button>
              </div>
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? 'Creating...' : 'Generate Code'}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-12 rounded bg-bg-surface" />
          </div>
        ) : activeInvites.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            No active invite codes. Create one to invite members.
          </p>
        ) : (
          <div className="space-y-2">
            {activeInvites.map((invite) => {
              const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
              const isExhausted = invite.useCount >= invite.maxUses;

              return (
                <div
                  key={invite.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border border-border-subtle p-3',
                    (isExpired || isExhausted) && 'opacity-60'
                  )}
                >
                  <div className="min-w-0">
                    <code className="text-sm font-mono font-bold text-text-primary tracking-wider">
                      {invite.code}
                    </code>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                      <span>{invite.useCount}/{invite.maxUses} uses</span>
                      <span className="text-border">|</span>
                      <span>{invite.assignedRole}</span>
                      {invite.expiresAt && (
                        <>
                          <span className="text-border">|</span>
                          <Clock className="h-3 w-3" />
                          <span>{isExpired ? 'Expired' : new Date(invite.expiresAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(invite.code, invite.id)}
                      className="h-7 w-7 p-0"
                      aria-label="Copy invite code"
                    >
                      {copiedId === invite.id ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeMutation.mutate(invite.id)}
                      className="h-7 w-7 p-0 text-danger hover:text-danger"
                      aria-label="Revoke invite code"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
