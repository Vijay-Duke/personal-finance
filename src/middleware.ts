/**
 * Astro middleware for multi-tenancy controls.
 * - Signup gate: blocks registration when disabled (unless invite code present)
 * - Household active check: blocks disabled households from API/page access
 */

import { defineMiddleware } from 'astro:middleware';
import { getAppSettings } from '@/lib/config/app-settings';
import { getSession } from '@/lib/auth/session';
import { checkHouseholdActive } from '@/lib/auth/guards';

// Paths that bypass all middleware checks
const BYPASS_PATHS = [
  '/api/auth/',
  '/health',
  '/api/admin/',
  '/auth/login',
  '/offline',
  '/disabled',
];

// Static asset extensions to skip
const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.svg', '.ico', '.woff', '.woff2', '.json', '.webmanifest'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Skip static assets
  if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return next();
  }

  // Skip bypass paths
  if (BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
    return next();
  }

  const settings = await getAppSettings();

  // Signup gate: if registration is disabled, redirect signup page to login
  // (unless there's an invite code in the URL)
  if (pathname === '/auth/signup' && settings.setupCompleted && !settings.registrationEnabled) {
    const inviteCode = context.url.searchParams.get('invite');
    if (!inviteCode) {
      return context.redirect('/auth/login');
    }
  }

  // Household active check for authenticated requests
  const session = await getSession(context);
  if (session?.user?.householdId) {
    const isActive = await checkHouseholdActive(session.user.householdId);
    if (!isActive) {
      // For API requests, return 403
      if (pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({ error: 'Your household has been disabled. Contact an administrator.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // For page requests, redirect to the disabled page
      if (pathname !== '/disabled') {
        return context.redirect('/disabled');
      }
    }
  }

  return next();
});
