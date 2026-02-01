import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Shield,
  ShieldCheck,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  displayKey: string;
  scope: 'read' | 'read_write';
  source: string;
  lastUsedAt: string | null;
  requestCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  isActive: boolean;
}

interface CreateKeyResponse {
  key: ApiKey;
  plainKey: string;
  message: string;
}

export function ApiKeysSettings() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'read' | 'read_write'>('read');
  const [newKeyExpiry, setNewKeyExpiry] = useState<string>('');
  const [newPlainKey, setNewPlainKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Fetch API keys
  const { data, isLoading, error } = useQuery<{ keys: ApiKey[] }>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/api-keys');
      if (!res.ok) throw new Error('Failed to fetch API keys');
      return res.json();
    },
  });

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; scope: string; expiresInDays?: number }) => {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create API key');
      return res.json() as Promise<CreateKeyResponse>;
    },
    onSuccess: (data) => {
      setNewPlainKey(data.plainKey);
      setShowCreateForm(false);
      setNewKeyName('');
      setNewKeyScope('read');
      setNewKeyExpiry('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  // Revoke API key mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke API key');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const handleCreate = () => {
    const expiresInDays = newKeyExpiry ? parseInt(newKeyExpiry) : undefined;
    createMutation.mutate({
      name: newKeyName,
      scope: newKeyScope,
      expiresInDays,
    });
  };

  const handleCopy = async (text: string, keyId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeKeys = data?.keys.filter((k) => k.isActive) || [];
  const revokedKeys = data?.keys.filter((k) => !k.isActive) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys
        </CardTitle>
        {!showCreateForm && !newPlainKey && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Key
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          API keys allow programmatic access to your financial data. Use them with the X-Api-Key header.
        </p>

        {/* New Key Display (shown once after creation) */}
        {newPlainKey && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Save your API key now!
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This is the only time you'll see this key. Copy it and store it securely.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded border font-mono text-sm">
              <code className="flex-1 break-all">{newPlainKey}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(newPlainKey, 'new')}
              >
                {copiedKeyId === 'new' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNewPlainKey(null)}
            >
              Done
            </Button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="p-4 bg-muted rounded-lg space-y-4">
            <h4 className="font-medium">Create New API Key</h4>

            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Home Assistant, CLI Tool"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyScope">Permissions</Label>
              <select
                id="keyScope"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={newKeyScope}
                onChange={(e) => setNewKeyScope(e.target.value as 'read' | 'read_write')}
              >
                <option value="read">Read Only - View accounts, transactions, balances</option>
                <option value="read_write">Read & Write - Full access including create/update/delete</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyExpiry">Expiration (optional)</Label>
              <select
                id="keyExpiry"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
              >
                <option value="">Never expires</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!newKeyName || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create Key
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-red-600">
            Failed to load API keys
          </div>
        )}

        {/* Active Keys */}
        {activeKeys.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Active Keys</h4>
            {activeKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key.name}</span>
                    {key.scope === 'read_write' ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                        <ShieldCheck className="h-3 w-3" />
                        Read & Write
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        <Shield className="h-3 w-3" />
                        Read Only
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-x-3">
                    <span>Key: {key.displayKey}</span>
                    <span>Created: {formatDate(key.createdAt)}</span>
                    <span>Last used: {formatDate(key.lastUsedAt)}</span>
                    <span>Requests: {key.requestCount}</span>
                    {key.expiresAt && (
                      <span className="text-yellow-600">
                        Expires: {formatDate(key.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
                      revokeMutation.mutate(key.id);
                    }
                  }}
                  disabled={revokeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Revoked Keys */}
        {revokedKeys.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Revoked Keys</h4>
            {revokedKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 border rounded-lg opacity-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium line-through">{key.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                      Revoked
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Revoked: {formatDate(key.revokedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && activeKeys.length === 0 && revokedKeys.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No API keys yet</p>
            <p className="text-sm">Create an API key to access your data programmatically</p>
          </div>
        )}

        {/* Usage Example */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Usage Example</h4>
          <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`curl -H "X-Api-Key: pfk_your_api_key_here" \\
  https://your-domain.com/api/accounts`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
