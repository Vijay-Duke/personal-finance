import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from './household';
import { users } from './user';

/**
 * AI Conversation table for storing chat history.
 *
 * Stores conversations between users and AI assistants, including
 * the message history as a JSON array.
 */
export const aiConversations = sqliteTable('ai_conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('New Conversation'),
  messages: text('messages', { mode: 'json' }).notNull().$defaultFn(() => []),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Message type for the JSON array.
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type AIConversation = typeof aiConversations.$inferSelect;
export type NewAIConversation = typeof aiConversations.$inferInsert;
