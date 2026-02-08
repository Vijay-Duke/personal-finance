/**
 * Application mode configuration.
 * Reads APP_MODE from environment to determine self-hosted vs SaaS behavior.
 */

export type AppMode = 'self-hosted' | 'saas';

const mode = (import.meta.env.APP_MODE || 'self-hosted') as AppMode;

export const appConfig = {
  mode,
  isSelfHosted: mode === 'self-hosted',
  isSaaS: mode === 'saas',
} as const;
