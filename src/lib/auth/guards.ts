/**
 * Role-based authorization guards for API routes and pages.
 */

import type { AuthenticatedContext } from './api-auth';
import type { UserRole } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { households } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { forbidden } from '@/lib/api/response';

/**
 * Check if a user has super_admin role.
 * Returns a 403 Response if not authorized, or null if OK.
 */
export function requireSuperAdmin(auth: AuthenticatedContext): Response | null {
  if (auth.role !== 'super_admin') {
    return forbidden('Super admin access required.');
  }
  return null;
}

/**
 * Check if a user is a household owner or super_admin.
 * Returns a 403 Response if not authorized, or null if OK.
 */
export function requireHouseholdOwner(auth: AuthenticatedContext): Response | null {
  if (auth.role !== 'owner' && auth.role !== 'super_admin') {
    return forbidden('Household owner access required.');
  }
  return null;
}

/**
 * Check if a household is active (not disabled by admin).
 * Returns false if the household is disabled.
 */
export async function checkHouseholdActive(householdId: string): Promise<boolean> {
  const [household] = await db
    .select({ isActive: households.isActive })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  return household?.isActive ?? false;
}
