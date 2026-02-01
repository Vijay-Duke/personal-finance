import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { cn } from '@/lib/utils/cn';
import type { AIProviderType } from '@/lib/db/schema';
import {
  Bot,
  Check,
  Star,
  Trash2,
  Power,
  PowerOff,
  Sparkles,
  Server,
  ExternalLink,
} from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  provider: AIProviderType;
  model: string;
  baseUrl: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AIProviderListProps {
  onAddNew: () => void;
}

const providerIcons: Record<AIProviderType, React.ReactNode> = {
  openai: <Sparkles className="h-5 w-5" />,
  anthropic: <Bot className="h-5 w-5" />,
  ollama: <Server className="h-5 w-5" />,
  custom: <ExternalLink className="h-5 w-5" />,
};

const providerLabels: Record<AIProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama',
  custom: 'Custom',
};

export function AIProviderList({ onAddNew }: AIProviderListProps) {
  const queryClient = useQueryClient();

  const { data: providers, isLoading, error } = useQuery<AIProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const res = await fetch('/api/ai/providers');
      if (!res.ok) throw new Error('Failed to fetch AI providers');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai/providers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete provider');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error('Failed to update provider');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/ai/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to update provider');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-danger">Error loading AI providers</p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['ai-providers'] })}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeProviders = providers?.filter((p) => p.isActive) || [];
  const hasDefault = providers?.some((p) => p.isDefault);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Providers
            </CardTitle>
            <CardDescription>
              {providers?.length
                ? `${activeProviders.length} active provider${activeProviders.length !== 1 ? 's' : ''}`
                : 'No providers configured'}
            </CardDescription>
          </div>
          <Button onClick={onAddNew}>
            + Add Provider
          </Button>
        </CardHeader>
      </Card>

      {/* Providers List */}
      <div className="grid grid-cols-1 gap-4">
        {providers?.map((provider) => (
          <Card
            key={provider.id}
            className={cn(
              'transition-all',
              !provider.isActive && 'opacity-60',
              provider.isDefault && 'ring-1 ring-primary-500'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Provider Icon */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    provider.isActive
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-content-bg text-text-muted'
                  )}
                >
                  {providerIcons[provider.provider]}
                </div>

                {/* Provider Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text-primary">{provider.name}</h3>
                    {provider.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                        <Star className="h-3 w-3" />
                        Default
                      </span>
                    )}
                    {!provider.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-text-muted/10 px-2 py-0.5 text-xs font-medium text-text-muted">
                        <PowerOff className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">
                    {providerLabels[provider.provider]} · {provider.model}
                  </p>
                  {provider.baseUrl && (
                    <p className="text-xs text-text-muted truncate">
                      {provider.baseUrl}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Set Default */}
                  {!provider.isDefault && provider.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(provider.id)}
                      disabled={setDefaultMutation.isPending}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4 text-text-muted hover:text-primary-600" />
                    </Button>
                  )}
                  {provider.isDefault && (
                    <span className="inline-flex items-center justify-center h-8 w-8">
                      <Check className="h-4 w-4 text-primary-600" />
                    </span>
                  )}

                  {/* Toggle Active */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleActiveMutation.mutate({
                        id: provider.id,
                        isActive: !provider.isActive,
                      })
                    }
                    disabled={toggleActiveMutation.isPending}
                    title={provider.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {provider.isActive ? (
                      <Power className="h-4 w-4 text-text-muted hover:text-success" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-text-muted hover:text-warning" />
                    )}
                  </Button>

                  {/* Delete */}
                  {!provider.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this provider?')) {
                          deleteMutation.mutate(provider.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      title="Delete provider"
                    >
                      <Trash2 className="h-4 w-4 text-text-muted hover:text-danger" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {providers?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-content-bg flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-text-muted" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No AI providers configured
              </h3>
              <p className="text-sm text-text-muted mb-4 max-w-sm mx-auto">
                Add an AI provider to start using AI features like chat, insights, and budget suggestions.
              </p>
              <Button onClick={onAddNew}>Add Your First Provider</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Warning if no default */}
      {providers && providers.length > 0 && !hasDefault && (
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-4 text-sm text-warning">
          <p className="font-medium">No default provider set</p>
          <p className="mt-1">
            Set one of your providers as default to ensure AI features work correctly.
          </p>
        </div>
      )}
    </div>
  );
}
