import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { db } from '../db';
import { aiProviders, type AIProvider, type AIProviderType } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from './encryption';

/**
 * Provider configuration interface.
 */
export interface ProviderConfig {
  provider: AIProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Default model configurations for each provider type.
 */
export const defaultModels: Record<AIProviderType, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  ollama: 'llama3.2',
  custom: 'gpt-4o-mini',
};

/**
 * Get the default AI provider for a household.
 * Returns the provider marked as default, or the first active provider.
 *
 * @param householdId - The household ID
 * @returns The default AI provider or null if none found
 */
export async function getDefaultProvider(householdId: string): Promise<AIProvider | null> {
  // First try to get the explicitly marked default
  const [defaultProvider] = await db
    .select()
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.householdId, householdId),
        eq(aiProviders.isDefault, true),
        eq(aiProviders.isActive, true)
      )
    );

  if (defaultProvider) {
    return defaultProvider;
  }

  // Fall back to the first active provider
  const [firstActive] = await db
    .select()
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.householdId, householdId),
        eq(aiProviders.isActive, true)
      )
    );

  return firstActive || null;
}

/**
 * Get a specific AI provider by ID.
 *
 * @param providerId - The provider ID
 * @param householdId - The household ID (for security verification)
 * @returns The AI provider or null if not found
 */
export async function getProviderById(
  providerId: string,
  householdId: string
): Promise<AIProvider | null> {
  const [provider] = await db
    .select()
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.id, providerId),
        eq(aiProviders.householdId, householdId)
      )
    );

  return provider || null;
}

/**
 * Decrypt the API key from a provider.
 *
 * @param provider - The AI provider with encrypted API key
 * @returns The decrypted API key or undefined
 */
export function getDecryptedApiKey(provider: AIProvider): string | undefined {
  if (!provider.apiKey) {
    return undefined;
  }

  try {
    return decrypt(provider.apiKey);
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return undefined;
  }
}

/**
 * Create a language model instance from a provider configuration.
 *
 * @param config - The provider configuration
 * @returns A LanguageModel instance
 * @throws Error if the provider type is unsupported or configuration is invalid
 */
export function createLanguageModel(config: ProviderConfig): LanguageModel {
  const { provider, model, apiKey, baseUrl } = config;

  switch (provider) {
    case 'openai':
      if (!apiKey) {
        throw new Error('API key is required for OpenAI provider');
      }
      return openai.api(model);

    case 'anthropic':
      if (!apiKey) {
        throw new Error('API key is required for Anthropic provider');
      }
      return anthropic(model);

    case 'ollama':
      // Ollama typically runs locally without an API key
      const ollamaClient = createOpenAI({
        baseURL: baseUrl || 'http://localhost:11434/api',
      });
      return ollamaClient(model);

    case 'custom':
      if (!baseUrl) {
        throw new Error('Base URL is required for custom provider');
      }
      if (!apiKey) {
        throw new Error('API key is required for custom provider');
      }
      const customClient = createOpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
      });
      return customClient(model);

    default:
      throw new Error(`Unsupported provider type: ${provider}`);
  }
}

/**
 * Create a language model from a stored AI provider.
 *
 * @param provider - The AI provider from the database
 * @returns A LanguageModel instance
 */
export function createLanguageModelFromProvider(provider: AIProvider): LanguageModel {
  const apiKey = getDecryptedApiKey(provider);

  return createLanguageModel({
    provider: provider.provider,
    model: provider.model,
    apiKey,
    baseUrl: provider.baseUrl || undefined,
  });
}

/**
 * Get the appropriate API key environment variable name for a provider.
 *
 * @param provider - The provider type
 * @returns The environment variable name
 */
export function getApiKeyEnvVar(provider: AIProviderType): string {
  switch (provider) {
    case 'openai':
      return 'OPENAI_API_KEY';
    case 'anthropic':
      return 'ANTHROPIC_API_KEY';
    case 'ollama':
      return '';
    case 'custom':
      return 'CUSTOM_AI_API_KEY';
    default:
      return '';
  }
}

/**
 * Validate a provider configuration.
 *
 * @param config - The provider configuration to validate
 * @returns An object with isValid flag and optional error message
 */
export function validateProviderConfig(config: ProviderConfig): { isValid: boolean; error?: string } {
  if (!config.provider) {
    return { isValid: false, error: 'Provider type is required' };
  }

  if (!config.model) {
    return { isValid: false, error: 'Model name is required' };
  }

  // API key is required for all providers except Ollama
  if (config.provider !== 'ollama' && !config.apiKey) {
    return { isValid: false, error: `API key is required for ${config.provider}` };
  }

  // Base URL is required for custom providers
  if (config.provider === 'custom' && !config.baseUrl) {
    return { isValid: false, error: 'Base URL is required for custom provider' };
  }

  return { isValid: true };
}

/**
 * List all available provider types with their display names.
 */
export const providerTypeOptions: { value: AIProviderType; label: string; description: string }[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT-4, GPT-4o, GPT-3.5 Turbo, and more',
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    description: 'Claude 3 Opus, Sonnet, and Haiku',
  },
  {
    value: 'ollama',
    label: 'Ollama',
    description: 'Self-hosted open source models (Llama, Mistral, etc.)',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Any OpenAI-compatible API endpoint',
  },
];

/**
 * Get recommended models for a provider type.
 *
 * @param provider - The provider type
 * @returns Array of recommended model names
 */
export function getRecommendedModels(provider: AIProviderType): string[] {
  switch (provider) {
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    case 'anthropic':
      return [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ];
    case 'ollama':
      return ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3'];
    case 'custom':
      return ['gpt-4o-mini', 'gpt-3.5-turbo'];
    default:
      return [];
  }
}
