import type { APIContext } from 'astro';
import { auth } from './index';

/**
 * Get the current session from an Astro API context.
 * Use this in Astro page frontmatter or API routes.
 *
 * @example
 * ---
 * import { getSession } from '@/lib/auth/session';
 * const session = await getSession(Astro);
 * if (!session) return Astro.redirect('/login');
 * ---
 */
export async function getSession(context: APIContext) {
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });
  return session;
}

/**
 * Require authentication for a page.
 * Redirects to login if not authenticated.
 *
 * @example
 * ---
 * import { requireAuth } from '@/lib/auth/session';
 * const { session, user } = await requireAuth(Astro);
 * ---
 */
export async function requireAuth(context: APIContext) {
  const session = await getSession(context);

  if (!session) {
    return context.redirect('/login');
  }

  return session;
}

/**
 * Check if the user is authenticated without redirecting.
 */
export async function isAuthenticated(context: APIContext): Promise<boolean> {
  const session = await getSession(context);
  return !!session;
}
