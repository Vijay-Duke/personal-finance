import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';

/**
 * Auth client for React components.
 * Provides hooks and methods for authentication in the browser.
 */
export const authClient = createAuthClient({
  baseURL: '', // Use relative URLs - works on any port/host
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
