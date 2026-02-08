import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Instance-level application settings.
 * Single-row table keyed by id = 'instance'.
 * Controls registration, deployment mode, and limits.
 */
export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey().default('instance'),
  instanceName: text('instance_name').notNull().default('Zen Finance'),
  registrationEnabled: integer('registration_enabled', { mode: 'boolean' }).notNull().default(true),
  setupCompleted: integer('setup_completed', { mode: 'boolean' }).notNull().default(false),
  maxHouseholds: integer('max_households').notNull().default(1), // 0 = unlimited
  maxUsersPerHousehold: integer('max_users_per_household').notNull().default(0), // 0 = unlimited
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type AppSettings = typeof appSettings.$inferSelect;
export type NewAppSettings = typeof appSettings.$inferInsert;
