import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { Settings, Save } from 'lucide-react';

interface AppSettings {
  id: string;
  instanceName: string;
  registrationEnabled: boolean;
  setupCompleted: boolean;
  maxHouseholds: number;
  maxUsersPerHousehold: number;
}

export function AdminSystemSettings() {
  const { data: settings, isLoading } = useApiQuery<AppSettings>(
    queryKeys.adminSettings,
    '/api/admin/settings'
  );
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<AppSettings>>({});

  const updateMutation = useApiMutation<AppSettings, Partial<AppSettings>>(
    (updates) =>
      fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then((r) => r.json()),
    {
      invalidateKeys: [queryKeys.adminSettings],
      onSuccess: () => setEditing(false),
    }
  );

  const startEditing = () => {
    if (!settings) return;
    setForm({
      instanceName: settings.instanceName,
      registrationEnabled: settings.registrationEnabled,
      maxHouseholds: settings.maxHouseholds,
      maxUsersPerHousehold: settings.maxUsersPerHousehold,
    });
    setEditing(true);
  };

  if (isLoading || !settings) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 rounded bg-bg-surface" />
            <div className="h-4 w-48 rounded bg-bg-surface" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        {editing ? (
          <div className="space-y-4">
            <div>
              <Label>Instance Name</Label>
              <Input
                value={form.instanceName || ''}
                onChange={(e) => setForm({ ...form, instanceName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="reg-enabled"
                checked={form.registrationEnabled ?? false}
                onChange={(e) => setForm({ ...form, registrationEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="reg-enabled">Registration Enabled</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max Households (0 = unlimited)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxHouseholds ?? 0}
                  onChange={(e) => setForm({ ...form, maxHouseholds: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Max Users/Household (0 = unlimited)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxUsersPerHousehold ?? 0}
                  onChange={(e) => setForm({ ...form, maxUsersPerHousehold: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} size="sm">
                <Save className="h-4 w-4 mr-1" />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)} size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Instance Name</dt>
              <dd className="text-text-primary font-medium">{settings.instanceName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Registration</dt>
              <dd className={settings.registrationEnabled ? 'text-success font-medium' : 'text-danger font-medium'}>
                {settings.registrationEnabled ? 'Enabled' : 'Disabled'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Max Households</dt>
              <dd className="text-text-primary font-medium">
                {settings.maxHouseholds === 0 ? 'Unlimited' : settings.maxHouseholds}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Max Users/Household</dt>
              <dd className="text-text-primary font-medium">
                {settings.maxUsersPerHousehold === 0 ? 'Unlimited' : settings.maxUsersPerHousehold}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
