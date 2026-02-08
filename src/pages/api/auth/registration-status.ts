import type { APIRoute } from 'astro';
import { getAppSettings } from '@/lib/config/app-settings';
import { appConfig } from '@/lib/config';
import { json } from '@/lib/api/response';

/**
 * GET /api/auth/registration-status
 * Public endpoint: returns whether registration is enabled.
 */
export const GET: APIRoute = async () => {
  const settings = await getAppSettings();

  return json({
    enabled: settings.registrationEnabled,
    mode: appConfig.mode,
    setupCompleted: settings.setupCompleted,
  });
};
