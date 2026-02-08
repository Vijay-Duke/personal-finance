/**
 * Service layer for the appSettings table.
 * Provides cached reads and typed updates for instance configuration.
 */

import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { AppSettings } from '@/lib/db/schema';

let cachedSettings: AppSettings | null = null;

/**
 * Ensure the singleton settings row exists.
 * Called lazily on first read.
 */
async function ensureSettingsRow(): Promise<void> {
  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, 'instance'))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(appSettings).values({ id: 'instance' });
  }
}

/**
 * Get current app settings (cached in memory).
 * Cache is invalidated on update.
 */
export async function getAppSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;

  await ensureSettingsRow();

  const [settings] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, 'instance'))
    .limit(1);

  cachedSettings = settings;
  return settings;
}

/**
 * Update app settings and invalidate cache.
 */
export async function updateAppSettings(
  updates: Partial<Pick<AppSettings, 'instanceName' | 'registrationEnabled' | 'setupCompleted' | 'maxHouseholds' | 'maxUsersPerHousehold'>>
): Promise<AppSettings> {
  await ensureSettingsRow();

  await db
    .update(appSettings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(appSettings.id, 'instance'));

  cachedSettings = null;
  return getAppSettings();
}

/**
 * Check if new user registration is currently allowed.
 */
export async function isRegistrationAllowed(): Promise<boolean> {
  const settings = await getAppSettings();
  return settings.registrationEnabled;
}

/**
 * Check if this is the first run (setup not yet completed).
 */
export async function isFirstRun(): Promise<boolean> {
  const settings = await getAppSettings();
  return !settings.setupCompleted;
}

/**
 * Invalidate the settings cache (useful after direct DB changes).
 */
export function invalidateSettingsCache(): void {
  cachedSettings = null;
}
