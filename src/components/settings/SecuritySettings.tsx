import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Lock, Monitor, Smartphone, Globe, Trash2, ShieldCheck } from 'lucide-react';

interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
  device: string;
}

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <SectionHeader label="Settings" title="Security" />
      <ChangePasswordCard />
      <ActiveSessionsCard />
      <TwoFactorCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mutation = useApiMutation<{ success: boolean }, void>(
    () =>
      fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to change password');
        return data;
      }),
    {
      onSuccess: () => {
        setMessage({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    mutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {(message || mutation.error) && (
            <p className={`text-sm ${message?.type === 'success' ? 'text-success' : 'text-danger'}`}>
              {message?.text || mutation.error?.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending || !currentPassword || !newPassword || !confirmPassword}
          >
            {mutation.isPending ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ActiveSessionsCard() {
  const { data: sessions, isLoading } = useApiQuery<SessionInfo[]>(
    queryKeys.userSessions,
    '/api/user/sessions'
  );

  const revokeMutation = useApiMutation<void, string>(
    (sessionId) =>
      fetch(`/api/user/sessions?id=${sessionId}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error('Failed to revoke session');
      }),
    { invalidateKeys: [queryKeys.userSessions] }
  );

  const getDeviceIcon = (device: string) => {
    if (device.includes('Mobile') || device.includes('iOS') || device.includes('Android')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (device.includes('Browser')) {
      return <Monitor className="h-4 w-4" />;
    }
    return <Globe className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Active Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded bg-bg-surface" />
            ))}
          </div>
        ) : !sessions?.length ? (
          <p className="text-sm text-text-muted">No active sessions.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 text-text-muted">
                    {getDeviceIcon(session.device)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      {session.device}
                      {session.isCurrent && (
                        <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      {session.ipAddress || 'Unknown IP'}
                      {' · '}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Revoke this session? The device will be signed out.')) {
                        revokeMutation.mutate(session.id);
                      }
                    }}
                    disabled={revokeMutation.isPending}
                    className="text-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TwoFactorCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <p className="text-sm text-text-muted">
          Two-factor authentication adds an extra layer of security.
          2FA setup is available through your profile settings and uses TOTP-based authenticator apps.
        </p>
      </CardContent>
    </Card>
  );
}
