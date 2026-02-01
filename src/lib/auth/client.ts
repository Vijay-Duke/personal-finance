import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';

/**
 * Auth client for React components.
 * Provides hooks and methods for authentication in the browser.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_BETTER_AUTH_URL || 'http://localhost:4321',
  plugins: [
    twoFactorClient(),
  ],
});

// Export commonly used hooks and methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  // Two-factor
  twoFactor,
} = authClient;

// Type for session data
export type Session = ReturnType<typeof useSession>['data'];
