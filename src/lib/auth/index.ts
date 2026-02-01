import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { db } from '../db';
import * as schema from '../db/schema';

/**
 * Better Auth configuration with 2FA support.
 *
 * Features:
 * - Email/password authentication
 * - TOTP-based two-factor authentication
 * - Session management with SQLite storage
 *
 * Note: WebAuthn passkeys can be added when the plugin becomes available.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.authAccounts,
      verification: schema.verifications,
    },
  }),

  // Email/password configuration
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === 'production',
    sendResetPassword: async ({ user, url }) => {
      // TODO: Implement email sending service (SendGrid, Resend, etc.)
      // In development, log the URL for testing
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Password reset link for ${user.email}: ${url}`);
      }
      // In production, this should send an actual email
      // For now, silently succeed - implement email service before enabling email verification
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Plugins for enhanced authentication
  plugins: [
    // Two-factor authentication (TOTP)
    twoFactor({
      issuer: 'Personal Finance',
      totpOptions: {
        period: 30,
        digits: 6,
      },
    }),
  ],

  // Custom user fields
  user: {
    additionalFields: {
      householdId: {
        type: 'string',
        required: false,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'member',
      },
    },
  },

  // Trust proxy for Docker/reverse proxy setups
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:4321',
  ],
});

// Export auth type for client usage
export type Auth = typeof auth;
