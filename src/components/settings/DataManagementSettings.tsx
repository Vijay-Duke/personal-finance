import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Database, Trash2, UserX, AlertTriangle } from 'lucide-react';

interface HouseholdInfo {
  id: string;
  name: string;
}

export function DataManagementSettings() {
  const { isOwner } = useCurrentUser();

  return (
    <div className="space-y-6">
      <SectionHeader label="Settings" title="Data Management" />
      {isOwner && <ClearDataCard />}
      <DeleteAccountCard />
    </div>
  );
}

function ClearDataCard() {
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: household } = useApiQuery<HouseholdInfo>(
    queryKeys.household,
    '/api/household'
  );

  const mutation = useApiMutation<{ success: boolean }, void>(
    () =>
      fetch('/api/household/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: confirmText }),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to clear data');
        return data;
      }),
    {
      invalidateKeys: [queryKeys.accounts, queryKeys.transactions, queryKeys.goals, queryKeys.budgets, queryKeys.dashboard],
      onSuccess: () => {
        setMessage({ type: 'success', text: 'All financial data has been cleared.' });
        setConfirmText('');
      },
    }
  );

  const householdName = household?.name || '';
  const isConfirmed = confirmText === householdName && householdName.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <Trash2 className="h-5 w-5" />
          Clear Financial Data
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 mb-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">This will permanently delete:</p>
              <ul className="text-sm text-text-muted mt-1 list-disc pl-4 space-y-0.5">
                <li>All financial accounts</li>
                <li>All transactions</li>
                <li>All budgets and goals</li>
                <li>All insurance policies</li>
              </ul>
              <p className="text-sm text-text-muted mt-2">
                Household members, settings, and categories will be preserved.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-md space-y-3">
          <label className="block text-sm font-medium text-text-primary">
            Type <span className="font-mono text-danger">{householdName}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Enter household name"
            className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-warning"
          />

          {(message || mutation.error) && (
            <p className={`text-sm ${message?.type === 'success' ? 'text-success' : 'text-danger'}`}>
              {message?.text || mutation.error?.message}
            </p>
          )}

          <Button
            variant="outline"
            onClick={() => mutation.mutate()}
            disabled={!isConfirmed || mutation.isPending}
            className="border-danger text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {mutation.isPending ? 'Clearing...' : 'Clear All Financial Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteAccountCard() {
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState<{ type: 'error'; text: string } | null>(null);
  const { user } = useCurrentUser();

  const mutation = useApiMutation<{ success: boolean }, void>(
    () =>
      fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: confirmText }),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to delete account');
        return data;
      }),
    {
      onSuccess: () => {
        window.location.href = '/auth/login';
      },
    }
  );

  const email = user?.email || '';
  const isConfirmed = confirmText === email && email.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-danger">
          <UserX className="h-5 w-5" />
          Delete Account
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 mb-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                This will permanently delete your account and all associated data.
              </p>
              <p className="text-sm text-text-muted mt-1">
                You will be removed from your household and all your sessions will be revoked.
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-md space-y-3">
          <label className="block text-sm font-medium text-text-primary">
            Type <span className="font-mono text-danger">{email}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-danger"
          />

          {(message || mutation.error) && (
            <p className="text-sm text-danger">
              {message?.text || mutation.error?.message}
            </p>
          )}

          <Button
            variant="outline"
            onClick={() => {
              if (confirm('This is your final chance. Delete your account permanently?')) {
                mutation.mutate();
              }
            }}
            disabled={!isConfirmed || mutation.isPending}
            className="border-danger text-danger hover:bg-danger/10"
          >
            <UserX className="h-4 w-4 mr-2" />
            {mutation.isPending ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
