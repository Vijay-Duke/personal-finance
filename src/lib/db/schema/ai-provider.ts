import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { households } from './household';

/**
 * AI Provider types supported by the system.
 */
export const aiProviderTypes = [
  'openai',
  'anthropic',
  'ollama',
  'custom',
] as const;

export type AIProviderType = typeof aiProviderTypes[number];

/**
 * AI Provider configuration table.
 *
 * Stores AI provider settings for a household, including API credentials
 * and model preferences. API keys are stored encrypted.
 */
export const aiProviders = sqliteTable('ai_providers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  provider: text('provider', { enum: aiProviderTypes }).notNull(),
  baseUrl: text('base_url'),
  apiKey: text('api_key'), // Encrypted
  model: text('model').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const aiProvidersRelations = relations(aiProviders, ({ one }) => ({
  household: one(households, {
    fields: [aiProviders.householdId],
    references: [households.id],
  }),
}));

export type AIProvider = typeof aiProviders.$inferSelect;
export type NewAIProvider = typeof aiProviders.$inferInsert;
