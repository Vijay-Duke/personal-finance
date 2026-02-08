import type { APIRoute } from 'astro';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { json, error } from '@/lib/api/response';
import { getAppSettings, updateAppSettings } from '@/lib/config/app-settings';

/**
 * GET /api/admin/settings
 * Get instance settings. Super admin only.
 */
export const GET: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const roleCheck = requireSuperAdmin(auth);
  if (roleCheck) return roleCheck;

  const settings = await getAppSettings();
  return json(settings);
};

/**
 * PATCH /api/admin/settings
 * Update instance settings. Super admin only.
 */
export const PATCH: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const roleCheck = requireSuperAdmin(auth);
  if (roleCheck) return roleCheck;

  const body = await context.request.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};

  if (typeof body.instanceName === 'string') updates.instanceName = body.instanceName.trim();
  if (typeof body.registrationEnabled === 'boolean') updates.registrationEnabled = body.registrationEnabled;
  if (typeof body.maxHouseholds === 'number' && body.maxHouseholds >= 0) updates.maxHouseholds = body.maxHouseholds;
  if (typeof body.maxUsersPerHousehold === 'number' && body.maxUsersPerHousehold >= 0) updates.maxUsersPerHousehold = body.maxUsersPerHousehold;

  if (Object.keys(updates).length === 0) {
    return error('No valid fields to update.', 400);
  }

  const settings = await updateAppSettings(updates as Parameters<typeof updateAppSettings>[0]);
  return json(settings);
};
