import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { AIProviderType } from '@/lib/db/schema';

interface AIProviderFormData {
  name: string;
  provider: AIProviderType | '';
  model: string;
  apiKey: string;
  baseUrl: string;
  isDefault: boolean;
  isActive: boolean;
}

const initialFormData: AIProviderFormData = {
  name: '',
  provider: '',
  model: '',
  apiKey: '',
  baseUrl: '',
  isDefault: false,
  isActive: true,
};

const providerOptions: { value: AIProviderType; label: string; defaultModel: string }[] = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-3-5-sonnet-20241022' },
  { value: 'ollama', label: 'Ollama (Local)', defaultModel: 'llama3.2' },
  { value: 'custom', label: 'Custom/OpenRouter', defaultModel: '' },
];

interface AIProviderFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export function AIProviderForm({ onCancel, onSuccess }: AIProviderFormProps) {
  const [formData, setFormData] = useState<AIProviderFormData>(initialFormData);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: AIProviderFormData) => {
      const res = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          provider: data.provider,
          model: data.model,
          apiKey: data.apiKey || undefined,
          baseUrl: data.baseUrl || undefined,
          isDefault: data.isDefault,
          isActive: data.isActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create AI provider');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      setFormData(initialFormData);
      onSuccess?.();
      onCancel();
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Auto-fill default model when provider changes
      if (name === 'provider' && value) {
        const provider = providerOptions.find((p) => p.value === value);
        if (provider && !prev.model) {
          newData.model = provider.defaultModel;
        }
      }

      return newData;
    });
  };

  const needsApiKey = formData.provider !== 'ollama';
  const isOllama = formData.provider === 'ollama';
  const isCustom = formData.provider === 'custom';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add AI Provider</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., My OpenAI"
                required
              />
            </div>

            {/* Provider Type */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider Type *</Label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                required
                className="flex h-10 w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="">Select provider...</option>
                {providerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder={isOllama ? 'llama3.2' : 'gpt-4o-mini'}
                required
              />
              <p className="text-xs text-text-muted">
                {isOllama
                  ? 'Ollama model name (e.g., llama3.2, mistral)'
                  : 'Model identifier (e.g., gpt-4o-mini, claude-3-5-sonnet-20241022)'}
              </p>
            </div>

            {/* API Key */}
            {needsApiKey && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  API Key {needsApiKey && '*'}
                </Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  placeholder="sk-..."
                  required={needsApiKey}
                />
                <p className="text-xs text-text-muted">
                  Your API key will be encrypted before storage
                </p>
              </div>
            )}

            {/* Base URL (for Ollama/Custom) */}
            {(isOllama || isCustom) && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="baseUrl">
                  Base URL {isOllama && '*'}
                </Label>
                <Input
                  id="baseUrl"
                  name="baseUrl"
                  value={formData.baseUrl}
                  onChange={handleInputChange}
                  placeholder={isOllama ? 'http://localhost:11434' : 'https://api.openrouter.ai/api/v1'}
                  required={isOllama}
                />
                <p className="text-xs text-text-muted">
                  {isOllama
                    ? 'Ollama server URL (default: http://localhost:11434)'
                    : 'Custom API endpoint URL'}
                </p>
              </div>
            )}

            {/* Checkboxes */}
            <div className="flex items-center gap-6 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">Set as default provider</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {createMutation.error && (
            <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
              {createMutation.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Provider'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
