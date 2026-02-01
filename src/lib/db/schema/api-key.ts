/**
 * API Keys Schema
 * Enables programmatic API access with scoped permissions
 * Based on Maybe Finance's API key implementation
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { users } from './user';

/**
 * API Key scopes:
 * - read: Read-only access to accounts, transactions, etc.
 * - read_write: Full access including create/update/delete
 */
export type ApiKeyScope = 'read' | 'read_write';

/**
 * API Key sources:
 * - web: Created via web interface
 * - mobile: Created via mobile app
 * - cli: Created via CLI tool
 */
export type ApiKeySource = 'web' | 'mobile' | 'cli';

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // User who owns this API key
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Human-readable name for the key (e.g., "My CLI Tool", "Home Assistant")
  name: text('name').notNull(),

  // The actual API key value (hashed for storage, shown once on creation)
  // Format: pfk_<random_string> (personal finance key)
  keyHash: text('key_hash').notNull(),

  // Display key - first 8 chars for identification (e.g., "pfk_abc1...")
  displayKey: text('display_key').notNull(),

  // Permission scope
  scope: text('scope').$type<ApiKeyScope>().notNull().default('read'),

  // Source where the key was created
  source: text('source').$type<ApiKeySource>().notNull().default('web'),

  // Usage tracking
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  requestCount: integer('request_count').notNull().default(0),

  // Expiration and revocation
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
