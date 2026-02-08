import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiQuery, useApiMutation, queryKeys } from '@/hooks/useApi';
import { Pencil, Check, X } from 'lucide-react';

interface Household {
  id: string;
  name: string;
  primaryCurrency: string;
  timezone: string;
  financialYearStart: number;
}

export function HouseholdDetails() {
  const { data: household, isLoading } = useApiQuery<Household>(
    queryKeys.household,
    '/api/household'
  );
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('');
  const [timezone, setTimezone] = useState('');

  const updateMutation = useApiMutation<Household, Partial<Household>>(
    (updates) =>
      fetch('/api/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then((r) => r.json()),
    { invalidateKeys: [queryKeys.household] }
  );

  const startEditing = () => {
    if (!household) return;
    setName(household.name);
    setCurrency(household.primaryCurrency);
    setTimezone(household.timezone);
    setEditing(true);
  };

  const save = () => {
    updateMutation.mutate(
      { name, primaryCurrency: currency, timezone },
      { onSuccess: () => setEditing(false) }
    );
  };

  if (isLoading) {
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

  if (!household) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Household Details</CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        {editing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hh-name">Name</Label>
              <Input
                id="hh-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hh-currency">Currency</Label>
              <Input
                id="hh-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1"
                placeholder="AUD"
              />
            </div>
            <div>
              <Label htmlFor="hh-tz">Timezone</Label>
              <Input
                id="hh-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1"
                placeholder="Australia/Sydney"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={updateMutation.isPending} size="sm">
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)} size="sm">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Name</dt>
              <dd className="text-text-primary font-medium">{household.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Currency</dt>
              <dd className="text-text-primary font-medium">{household.primaryCurrency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Timezone</dt>
              <dd className="text-text-primary font-medium">{household.timezone}</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
