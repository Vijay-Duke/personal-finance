import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './user';
import { accounts } from './accounts/account';

/**
 * Permission levels for account access
 */
export const permissionLevels = ['owner', 'editor', 'viewer'] as const;
export type PermissionLevel = typeof permissionLevels[number];

/**
 * User-Account permissions table
 *
 * This enables fine-grained access control within households:
 * - By default, all household members can view all accounts
 * - Specific accounts can be restricted to certain users
 * - Different permission levels allow different actions
 *
 * Permission levels:
 * - owner: Full access - can modify account settings, delete, manage permissions
 * - editor: Can add/edit/delete transactions, update balances
 * - viewer: Read-only access to view account and transactions
 */
export const userAccountPermissions = sqliteTable('user_account_permissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // User being granted access
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Account being accessed
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // Permission level
  permission: text('permission', { enum: permissionLevels })
    .notNull()
    .default('viewer'),

  // Who granted this permission
  grantedBy: text('granted_by')
    .references(() => users.id, { onDelete: 'set null' }),

  // When the permission was granted
  grantedAt: integer('granted_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),

  // Optional expiration for temporary access
  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  // Notes about why permission was granted
  notes: text('notes'),
});

// Create unique constraint on user + account
export const userAccountPermissionUnique = {
  userAccount: ['user_id', 'account_id'] as const,
};

export type UserAccountPermission = typeof userAccountPermissions.$inferSelect;
export type NewUserAccountPermission = typeof userAccountPermissions.$inferInsert;

/**
 * Account visibility settings table
 *
 * Controls whether an account uses the default household-wide visibility
 * or requires explicit permissions.
 */
export const accountVisibilitySettings = sqliteTable('account_visibility_settings', {
  accountId: text('account_id')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'cascade' }),

  // If true, only users with explicit permissions can see this account
  // If false (default), all household members can see it
  restrictedAccess: integer('restricted_access', { mode: 'boolean' })
    .notNull()
    .default(false),

  // If restricted, what's the default permission for new household members?
  // null = no access, 'viewer' = read-only by default
  defaultPermission: text('default_permission', { enum: [...permissionLevels, 'none'] }),

  // Hide from net worth calculations for users without explicit permission?
  hideFromNetWorth: integer('hide_from_net_worth', { mode: 'boolean' })
    .notNull()
    .default(false),

  // Who last modified these settings
  updatedBy: text('updated_by')
    .references(() => users.id, { onDelete: 'set null' }),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type AccountVisibilitySettings = typeof accountVisibilitySettings.$inferSelect;
export type NewAccountVisibilitySettings = typeof accountVisibilitySettings.$inferInsert;

/**
 * Helper to check if a user has at least a certain permission level
 */
export function hasPermissionLevel(
  userPermission: PermissionLevel | undefined,
  requiredLevel: PermissionLevel
): boolean {
  if (!userPermission) return false;

  const levels: PermissionLevel[] = ['viewer', 'editor', 'owner'];
  const userIndex = levels.indexOf(userPermission);
  const requiredIndex = levels.indexOf(requiredLevel);

  return userIndex >= requiredIndex;
}
