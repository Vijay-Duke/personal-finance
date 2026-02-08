import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Bell, BellRing, TrendingDown, Target, RefreshCw, AlertTriangle, DollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelPrefs {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

type NotificationPrefs = Record<string, ChannelPrefs>;

const notificationTypes = [
  { key: 'budget_warning', label: 'Budget Warnings', description: 'When spending approaches budget limits', icon: <TrendingDown className="h-4 w-4" /> },
  { key: 'goal_milestone', label: 'Goal Milestones', description: 'When goals reach progress milestones', icon: <Target className="h-4 w-4" /> },
  { key: 'transaction_alert', label: 'Transaction Alerts', description: 'Notable transaction activity', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'sync_complete', label: 'Sync Complete', description: 'When data sync finishes successfully', icon: <RefreshCw className="h-4 w-4" /> },
  { key: 'sync_failed', label: 'Sync Failed', description: 'When data sync encounters errors', icon: <AlertTriangle className="h-4 w-4" /> },
  { key: 'price_alert', label: 'Price Alerts', description: 'Stock and crypto price changes', icon: <BellRing className="h-4 w-4" /> },
  { key: 'system', label: 'System Notifications', description: 'App updates and maintenance', icon: <Info className="h-4 w-4" /> },
] as const;

export function NotificationsSettings() {
  const { data: prefs, isLoading } = useApiQuery<NotificationPrefs>(
    queryKeys.notificationPreferences,
    '/api/user/notification-preferences'
  );

  const mutation = useApiMutation<NotificationPrefs, Partial<NotificationPrefs>>(
    (updates) =>
      fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to update preferences');
        return r.json();
      }),
    { invalidateKeys: [queryKeys.notificationPreferences] }
  );

  const toggleInApp = (key: string) => {
    if (!prefs) return;
    const current = prefs[key] || { inApp: true, email: false, push: false };
    mutation.mutate({
      [key]: { ...current, inApp: !current.inApp },
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader label="Settings" title="Notifications" />

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded bg-bg-surface" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="space-y-4">
              {notificationTypes.map(({ key, label, description, icon }) => {
                const enabled = prefs?.[key]?.inApp ?? true;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border-subtle p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 text-text-muted">{icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">{label}</p>
                        <p className="text-xs text-text-muted">{description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => toggleInApp(key)}
                      disabled={mutation.isPending}
                      className={cn(
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        enabled ? 'bg-primary-500' : 'bg-bg-surface'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                          enabled ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email & Push coming soon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-text-muted">Email & Push Notifications</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <p className="text-sm text-text-muted">
            Email and push notification channels will be available in a future update.
            Your in-app preferences above will also apply to those channels when enabled.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
