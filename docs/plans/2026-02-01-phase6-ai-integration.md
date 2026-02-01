# Phase 6: AI Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive AI integration system with provider management, chat interface, and AI-powered financial insights.

**Architecture:** Use Vercel AI SDK for streaming responses with a provider abstraction layer supporting OpenAI, Anthropic, and Ollama. Store encrypted API keys per household. Build a sliding chat panel with context-aware financial queries. AI features operate on available data, gracefully degrading when financial data is minimal.

**Tech Stack:** Vercel AI SDK (`ai` package), Drizzle ORM, React, Tailwind CSS, better-auth for auth context

---

## Prerequisites

- Phase 1 foundation complete (DB, auth, layouts)
- Node.js dependencies: `ai` package for Vercel AI SDK
- Environment variable: `ENCRYPTION_KEY` for API key encryption

---

## Task 1: Install Vercel AI SDK Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**

Run:
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

**Step 2: Verify installation**

Run:
```bash
npm list ai @ai-sdk/openai @ai-sdk/anthropic
```
Expected: Packages installed with versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add Vercel AI SDK with OpenAI and Anthropic providers"
```

---

## Task 2: Create AIProvider Database Schema

**Files:**
- Create: `src/lib/db/schema/ai-provider.ts`
- Modify: `src/lib/db/schema/index.ts`

**Step 1: Create AIProvider schema**

Create `src/lib/db/schema/ai-provider.ts`:

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { households } from './household';

export const aiProviders = sqliteTable('ai_providers', {
  id: text('id').primaryKey(),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  provider: text('provider', { enum: ['openai', 'anthropic', 'ollama', 'custom'] }).notNull(),
  baseUrl: text('base_url'),
  apiKey: text('api_key'), // Encrypted
  model: text('model').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const aiProvidersRelations = relations(aiProviders, ({ one }) => ({
  household: one(households, {
    fields: [aiProviders.householdId],
    references: [households.id],
  }),
}));

export type AIProvider = typeof aiProviders.$inferSelect;
export type NewAIProvider = typeof aiProviders.$inferInsert;
```

**Step 2: Export from schema index**

Modify `src/lib/db/schema/index.ts` - add to the exports section:

```typescript
// AI Integration
export {
  aiProviders,
  type AIProvider,
  type NewAIProvider,
} from './ai-provider';
```

**Step 3: Push schema to database**

Run:
```bash
npm run db:push
```
Expected: Schema pushed successfully, ai_providers table created

**Step 4: Commit**

```bash
git add src/lib/db/schema/ai-provider.ts src/lib/db/schema/index.ts
git commit -m "feat(db): add AIProvider schema for storing AI configurations"
```

---

## Task 3: Create AIConversation Schema

**Files:**
- Create: `src/lib/db/schema/ai-conversation.ts`
- Modify: `src/lib/db/schema/index.ts`

**Step 1: Create AIConversation schema**

Create `src/lib/db/schema/ai-conversation.ts`:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { households } from './household';
import { users } from './user';

export const aiConversations = sqliteTable('ai_conversations', {
  id: text('id').primaryKey(),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('New Conversation'),
  messages: text('messages', { mode: 'json' }).notNull().$defaultFn(() => []),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  household: one(households, {
    fields: [aiConversations.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

// Message type for the JSON array
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type AIConversation = typeof aiConversations.$inferSelect;
export type NewAIConversation = typeof aiConversations.$inferInsert;
```

**Step 2: Export from schema index**

Modify `src/lib/db/schema/index.ts` - add:

```typescript
export {
  aiConversations,
  type AIConversation,
  type NewAIConversation,
  type AIMessage,
} from './ai-conversation';
```

**Step 3: Push schema**

Run:
```bash
npm run db:push
```

**Step 4: Commit**

```bash
git add src/lib/db/schema/ai-conversation.ts src/lib/db/schema/index.ts
git commit -m "feat(db): add AIConversation schema for chat history"
```

---

## Task 4: Create API Key Encryption Utility

**Files:**
- Create: `src/lib/ai/encryption.ts`

**Step 1: Create encryption utility**

Create `src/lib/ai/encryption.ts`:

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

// Derive a 32-byte key from the environment variable
const KEY = scryptSync(ENCRYPTION_KEY, 'salt', 32);
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Step 2: Add ENCRYPTION_KEY to env example**

Modify `.env.example` - add:

```
# AI Encryption
ENCRYPTION_KEY=your-32-character-minimum-encryption-key-here
```

**Step 3: Commit**

```bash
git add src/lib/ai/encryption.ts .env.example
git commit -m "feat(ai): add API key encryption utility"
```

---

## Task 5: Create AI Provider API Routes

**Files:**
- Create: `src/pages/api/ai/providers.ts`
- Create: `src/pages/api/ai/providers/[id].ts`

**Step 1: Create providers list/create endpoint**

Create `src/pages/api/ai/providers.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { aiProviders, type NewAIProvider } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/ai/encryption';
import { json, unauthorized, validationError, created } from '@/lib/api/response';

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const providers = await db.query.aiProviders.findMany({
    where: (providers, { eq }) => eq(providers.householdId, user.householdId),
    orderBy: (providers, { desc }) => [desc(providers.isDefault), desc(providers.createdAt)],
  });

  // Don't return encrypted API keys to client
  const sanitized = providers.map(p => ({
    ...p,
    apiKey: p.apiKey ? '***' : undefined,
  }));

  return json(sanitized);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  try {
    const body = await request.json();
    const { name, provider, baseUrl, apiKey, model, isDefault } = body;

    // Validation
    if (!name || !provider || !model) {
      return validationError({
        name: !name ? 'Name is required' : undefined,
        provider: !provider ? 'Provider is required' : undefined,
        model: !model ? 'Model is required' : undefined,
      });
    }

    const id = crypto.randomUUID();
    const newProvider: NewAIProvider = {
      id,
      householdId: user.householdId,
      name,
      provider,
      baseUrl: baseUrl || null,
      apiKey: apiKey ? encrypt(apiKey) : null,
      model,
      isDefault: isDefault || false,
      isActive: true,
    };

    // If setting as default, unset others
    if (isDefault) {
      await db.update(aiProviders)
        .set({ isDefault: false })
        .where(eq(aiProviders.householdId, user.householdId));
    }

    await db.insert(aiProviders).values(newProvider);

    return created({ ...newProvider, apiKey: apiKey ? '***' : undefined });
  } catch (error) {
    console.error('Failed to create AI provider:', error);
    return json({ error: 'Failed to create AI provider' }, { status: 500 });
  }
};
```

**Step 2: Create single provider endpoint**

Create `src/pages/api/ai/providers/[id].ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { aiProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/ai/encryption';
import { json, unauthorized, notFound, noContent } from '@/lib/api/response';

export const GET: APIRoute = async ({ params, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const provider = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.id, params.id!),
      eq(aiProviders.householdId, user.householdId)
    ),
  });

  if (!provider) {
    return notFound('AI provider not found');
  }

  return json({
    ...provider,
    apiKey: provider.apiKey ? '***' : undefined,
  });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const existing = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.id, params.id!),
      eq(aiProviders.householdId, user.householdId)
    ),
  });

  if (!existing) {
    return notFound('AI provider not found');
  }

  try {
    const body = await request.json();
    const { name, baseUrl, apiKey, model, isDefault, isActive } = body;

    // If setting as default, unset others
    if (isDefault && !existing.isDefault) {
      await db.update(aiProviders)
        .set({ isDefault: false })
        .where(eq(aiProviders.householdId, user.householdId));
    }

    const updates: Partial<typeof aiProviders.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updates.name = name;
    if (baseUrl !== undefined) updates.baseUrl = baseUrl;
    if (apiKey !== undefined) updates.apiKey = apiKey ? encrypt(apiKey) : null;
    if (model !== undefined) updates.model = model;
    if (isDefault !== undefined) updates.isDefault = isDefault;
    if (isActive !== undefined) updates.isActive = isActive;

    await db.update(aiProviders)
      .set(updates)
      .where(eq(aiProviders.id, params.id!));

    return json({ success: true });
  } catch (error) {
    console.error('Failed to update AI provider:', error);
    return json({ error: 'Failed to update AI provider' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  await db.delete(aiProviders)
    .where(and(
      eq(aiProviders.id, params.id!),
      eq(aiProviders.householdId, user.householdId)
    ));

  return noContent();
};
```

**Step 3: Commit**

```bash
git add src/pages/api/ai/providers.ts src/pages/api/ai/providers/
git commit -m "feat(api): add AI provider CRUD endpoints"
```

---

## Task 6: Create AI Conversation API Routes

**Files:**
- Create: `src/pages/api/ai/conversations.ts`
- Create: `src/pages/api/ai/conversations/[id].ts`
- Create: `src/pages/api/ai/conversations/[id]/messages.ts`

**Step 1: Create conversations list/create endpoint**

Create `src/pages/api/ai/conversations.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { aiConversations, type NewAIConversation, type AIMessage } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { json, unauthorized, created } from '@/lib/api/response';

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const conversations = await db.query.aiConversations.findMany({
    where: (conversations, { and, eq }) => and(
      eq(conversations.householdId, user.householdId),
      eq(conversations.userId, session.user.id)
    ),
    orderBy: (conversations, { desc }) => [desc(conversations.updatedAt)],
  });

  return json(conversations);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  try {
    const body = await request.json();
    const { title } = body;

    const id = crypto.randomUUID();
    const newConversation: NewAIConversation = {
      id,
      householdId: user.householdId,
      userId: session.user.id,
      title: title || 'New Conversation',
      messages: [],
    };

    await db.insert(aiConversations).values(newConversation);

    return created(newConversation);
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return json({ error: 'Failed to create conversation' }, { status: 500 });
  }
};
```

**Step 2: Create single conversation endpoint**

Create `src/pages/api/ai/conversations/[id].ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { aiConversations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, unauthorized, notFound, noContent } from '@/lib/api/response';

export const GET: APIRoute = async ({ params, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const conversation = await db.query.aiConversations.findFirst({
    where: and(
      eq(aiConversations.id, params.id!),
      eq(aiConversations.householdId, user.householdId)
    ),
  });

  if (!conversation) {
    return notFound('Conversation not found');
  }

  return json(conversation);
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const existing = await db.query.aiConversations.findFirst({
    where: and(
      eq(aiConversations.id, params.id!),
      eq(aiConversations.householdId, user.householdId)
    ),
  });

  if (!existing) {
    return notFound('Conversation not found');
  }

  try {
    const body = await request.json();
    const { title } = body;

    await db.update(aiConversations)
      .set({
        title: title || existing.title,
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, params.id!));

    return json({ success: true });
  } catch (error) {
    console.error('Failed to update conversation:', error);
    return json({ error: 'Failed to update conversation' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  await db.delete(aiConversations)
    .where(and(
      eq(aiConversations.id, params.id!),
      eq(aiConversations.householdId, user.householdId)
    ));

  return noContent();
};
```

**Step 3: Create messages endpoint for adding messages**

Create `src/pages/api/ai/conversations/[id]/messages.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { aiConversations, type AIMessage } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, unauthorized, notFound } from '@/lib/api/response';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const conversation = await db.query.aiConversations.findFirst({
    where: and(
      eq(aiConversations.id, params.id!),
      eq(aiConversations.householdId, user.householdId)
    ),
  });

  if (!conversation) {
    return notFound('Conversation not found');
  }

  try {
    const body = await request.json();
    const { role, content } = body;

    const newMessage: AIMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    const messages = [...(conversation.messages as AIMessage[]), newMessage];

    await db.update(aiConversations)
      .set({
        messages,
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, params.id!));

    return json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Failed to add message:', error);
    return json({ error: 'Failed to add message' }, { status: 500 });
  }
};
```

**Step 4: Commit**

```bash
git add src/pages/api/ai/conversations.ts src/pages/api/ai/conversations/
git commit -m "feat(api): add AI conversation endpoints"
```

---

## Task 7: Create AI Provider Service

**Files:**
- Create: `src/lib/ai/provider.ts`

**Step 1: Create provider service**

Create `src/lib/ai/provider.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV1 } from 'ai';
import { db } from '@/lib/db';
import { aiProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from './encryption';

export type AIProviderType = 'openai' | 'anthropic' | 'ollama' | 'custom';

export interface ProviderConfig {
  provider: AIProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export async function getDefaultProvider(householdId: string): Promise<ProviderConfig | null> {
  const provider = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.householdId, householdId),
      eq(aiProviders.isDefault, true),
      eq(aiProviders.isActive, true)
    ),
  });

  if (!provider) {
    // Try to get any active provider
    const anyProvider = await db.query.aiProviders.findFirst({
      where: and(
        eq(aiProviders.householdId, householdId),
        eq(aiProviders.isActive, true)
      ),
    });

    if (!anyProvider) return null;

    return {
      provider: anyProvider.provider,
      model: anyProvider.model,
      apiKey: anyProvider.apiKey ? decrypt(anyProvider.apiKey) : undefined,
      baseUrl: anyProvider.baseUrl || undefined,
    };
  }

  return {
    provider: provider.provider,
    model: provider.model,
    apiKey: provider.apiKey ? decrypt(provider.apiKey) : undefined,
    baseUrl: provider.baseUrl || undefined,
  };
}

export function createLanguageModel(config: ProviderConfig): LanguageModelV1 {
  switch (config.provider) {
    case 'openai':
      if (config.apiKey) {
        const customOpenAI = createOpenAI({ apiKey: config.apiKey });
        return customOpenAI(config.model);
      }
      return openai(config.model);

    case 'anthropic':
      if (config.apiKey) {
        return anthropic(config.model, { apiKey: config.apiKey });
      }
      return anthropic(config.model);

    case 'ollama':
      const ollamaBaseUrl = config.baseUrl || 'http://localhost:11434';
      const ollamaOpenAI = createOpenAI({
        baseURL: `${ollamaBaseUrl}/v1`,
        apiKey: 'ollama', // Ollama doesn't require a real API key
      });
      return ollamaOpenAI(config.model);

    case 'custom':
      if (!config.baseUrl) {
        throw new Error('Custom provider requires baseUrl');
      }
      const customClient = createOpenAI({
        baseURL: config.baseUrl,
        apiKey: config.apiKey || '',
      });
      return customClient(config.model);

    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

export function getProviderDisplayName(provider: AIProviderType): string {
  switch (provider) {
    case 'openai': return 'OpenAI';
    case 'anthropic': return 'Anthropic';
    case 'ollama': return 'Ollama';
    case 'custom': return 'Custom';
    default: return provider;
  }
}

export const RECOMMENDED_MODELS: Record<AIProviderType, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  ollama: ['llama3.2', 'llama3.1', 'mistral', 'codellama'],
  custom: [],
};
```

**Step 2: Commit**

```bash
git add src/lib/ai/provider.ts
git commit -m "feat(ai): add AI provider service with multi-provider support"
```

---

## Task 8: Create Financial Context Builder

**Files:**
- Create: `src/lib/ai/context-builder.ts`

**Step 1: Create context builder**

Create `src/lib/ai/context-builder.ts`:

```typescript
import { db } from '@/lib/db';
import { accounts, accountTypes, stocks, cryptoAssets, bankAccounts } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export interface FinancialContext {
  netWorth: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    currency: string;
  };
  accounts: Array<{
    name: string;
    type: string;
    balance: number;
    currency: string;
    isLiquid: boolean;
  }>;
  recentTransactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
  spendingByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  goals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
  }>;
  userProfile?: {
    targetRetirementAge?: number;
    annualIncome?: number;
    riskTolerance?: string;
  };
}

export async function buildFinancialContext(
  householdId: string,
  options: { includeTransactions?: boolean; daysOfHistory?: number } = {}
): Promise<FinancialContext> {
  const { includeTransactions = true, daysOfHistory = 30 } = options;

  // Get household for primary currency
  const household = await db.query.households.findFirst({
    where: (households, { eq }) => eq(households.id, householdId),
  });

  const primaryCurrency = household?.primaryCurrency || 'USD';

  // Get all accounts
  const householdAccounts = await db.query.accounts.findMany({
    where: and(
      eq(accounts.householdId, householdId),
      eq(accounts.isActive, true)
    ),
    with: {
      bankAccount: true,
      stocks: true,
      cryptoAssets: true,
    },
  });

  // Calculate totals
  let totalAssets = 0;
  const accountSummaries = householdAccounts.map(acc => {
    let balance = 0;

    // Get balance based on account type
    switch (acc.type) {
      case 'bank_account':
        balance = acc.bankAccount?.balance || 0;
        break;
      case 'stock':
        balance = acc.stocks?.reduce((sum, s) =>
          sum + (s.shares * (s.averageCostBasis || 0)), 0) || 0;
        break;
      case 'crypto':
        balance = acc.cryptoAssets?.reduce((sum, c) =>
          sum + (c.holdings * (c.averageCostBasis || 0)), 0) || 0;
        break;
      default:
        balance = acc.currentBalance || 0;
    }

    totalAssets += balance; // TODO: Convert currency

    return {
      name: acc.name,
      type: acc.type,
      balance,
      currency: acc.currency,
      isLiquid: acc.isLiquid,
    };
  });

  // Get recent transactions if requested
  const recentTransactions = includeTransactions
    ? await getRecentTransactions(householdId, daysOfHistory)
    : [];

  // Calculate spending by category
  const spendingByCategory = calculateSpendingByCategory(recentTransactions);

  // Get goals (placeholder - implement when goals schema exists)
  const goals: FinancialContext['goals'] = [];

  return {
    netWorth: {
      totalAssets,
      totalLiabilities: 0, // TODO: Implement when debts schema exists
      netWorth: totalAssets,
      currency: primaryCurrency,
    },
    accounts: accountSummaries,
    recentTransactions,
    spendingByCategory,
    goals,
  };
}

async function getRecentTransactions(
  householdId: string,
  days: number
): Promise<FinancialContext['recentTransactions']> {
  // TODO: Implement when transaction schema exists
  // For now, return empty array
  return [];
}

function calculateSpendingByCategory(
  transactions: FinancialContext['recentTransactions']
): FinancialContext['spendingByCategory'] {
  if (transactions.length === 0) return [];

  const categoryTotals = new Map<string, number>();
  let totalSpending = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      const category = 'Uncategorized'; // TODO: Get from transaction category
      const current = categoryTotals.get(category) || 0;
      categoryTotals.set(category, current + tx.amount);
      totalSpending += tx.amount;
    }
  }

  return Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function formatContextForPrompt(context: FinancialContext): string {
  const lines: string[] = [
    '=== Financial Context ===',
    '',
    `Net Worth: ${context.netWorth.currency} ${context.netWorth.netWorth.toLocaleString()}`,
    `  - Total Assets: ${context.netWorth.currency} ${context.netWorth.totalAssets.toLocaleString()}`,
    `  - Total Liabilities: ${context.netWorth.currency} ${context.netWorth.totalLiabilities.toLocaleString()}`,
    '',
    'Accounts:',
  ];

  for (const acc of context.accounts) {
    lines.push(`  - ${acc.name} (${acc.type}): ${acc.currency} ${acc.balance.toLocaleString()}${acc.isLiquid ? ' [Liquid]' : ''}`);
  }

  if (context.spendingByCategory.length > 0) {
    lines.push('', 'Spending by Category (Last 30 days):');
    for (const cat of context.spendingByCategory) {
      lines.push(`  - ${cat.category}: $${cat.amount.toLocaleString()} (${cat.percentage.toFixed(1)}%)`);
    }
  }

  if (context.goals.length > 0) {
    lines.push('', 'Goals:');
    for (const goal of context.goals) {
      lines.push(`  - ${goal.name}: ${goal.progress.toFixed(0)}% ($${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()})`);
    }
  }

  lines.push('=== End Context ===');

  return lines.join('\n');
}
```

**Step 2: Commit**

```bash
git add src/lib/ai/context-builder.ts
git commit -m "feat(ai): add financial context builder for AI prompts"
```

---

## Task 9: Create AI Chat API with Streaming

**Files:**
- Create: `src/pages/api/ai/chat.ts`

**Step 1: Create streaming chat endpoint**

Create `src/pages/api/ai/chat.ts`:

```typescript
import type { APIRoute } from 'astro';
import { streamText, type Message } from 'ai';
import { db } from '@/lib/db';
import { aiConversations, type AIMessage } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getDefaultProvider, createLanguageModel } from '@/lib/ai/provider';
import { buildFinancialContext, formatContextForPrompt } from '@/lib/ai/context-builder';
import { unauthorized, json } from '@/lib/api/response';

const SYSTEM_PROMPT = `You are a helpful personal finance assistant. You have access to the user's financial data and can help them understand their finances, answer questions about spending, investments, and provide insights.

Guidelines:
- Be concise but informative
- Use specific numbers from the context when relevant
- If you don't have certain data, say so clearly
- Provide actionable advice when appropriate
- Be encouraging about financial goals
- Never make up data that isn't in the context

{context}`;

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  try {
    const body = await request.json();
    const { message, conversationId } = body;

    // Get or create conversation
    let conversation = conversationId
      ? await db.query.aiConversations.findFirst({
          where: and(
            eq(aiConversations.id, conversationId),
            eq(aiConversations.householdId, user.householdId)
          ),
        })
      : null;

    if (!conversation) {
      // Create new conversation
      const id = crypto.randomUUID();
      await db.insert(aiConversations).values({
        id,
        householdId: user.householdId,
        userId: session.user.id,
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [],
      });

      conversation = await db.query.aiConversations.findFirst({
        where: eq(aiConversations.id, id),
      });
    }

    if (!conversation) {
      return json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Get AI provider
    const providerConfig = await getDefaultProvider(user.householdId);
    if (!providerConfig) {
      return json({
        error: 'No AI provider configured',
        code: 'NO_PROVIDER'
      }, { status: 400 });
    }

    // Build financial context
    const financialContext = await buildFinancialContext(user.householdId);
    const contextString = formatContextForPrompt(financialContext);

    // Prepare messages
    const history = (conversation.messages as AIMessage[]).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT.replace('{context}', contextString) },
      ...history,
      { role: 'user', content: message },
    ];

    // Create model and stream
    const model = createLanguageModel(providerConfig);

    const result = streamText({
      model,
      messages,
      maxTokens: 2000,
    });

    // Save user message
    const userMessage: AIMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    await db.update(aiConversations)
      .set({
        messages: [...(conversation.messages as AIMessage[]), userMessage],
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, conversation.id));

    // Return streaming response
    return result.toDataStreamResponse({
      headers: {
        'X-Conversation-Id': conversation.id,
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return json({ error: 'Failed to process chat message' }, { status: 500 });
  }
};
```

**Step 2: Commit**

```bash
git add src/pages/api/ai/chat.ts
git commit -m "feat(api): add streaming AI chat endpoint with context"
```

---

## Task 10: Create AI Provider Settings UI

**Files:**
- Create: `src/components/ai/AIProviderForm.tsx`
- Create: `src/components/ai/AIProviderList.tsx`

**Step 1: Create AI provider form component**

Create `src/components/ai/AIProviderForm.tsx`:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RECOMMENDED_MODELS, type AIProviderType } from '@/lib/ai/provider';

interface AIProviderFormProps {
  onSubmit: (data: ProviderFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ProviderFormData>;
}

export interface ProviderFormData {
  name: string;
  provider: AIProviderType;
  model: string;
  apiKey: string;
  baseUrl: string;
  isDefault: boolean;
}

export function AIProviderForm({ onSubmit, onCancel, initialData }: AIProviderFormProps) {
  const [formData, setFormData] = useState<ProviderFormData>({
    name: initialData?.name || '',
    provider: initialData?.provider || 'openai',
    model: initialData?.model || '',
    apiKey: initialData?.apiKey || '',
    baseUrl: initialData?.baseUrl || '',
    isDefault: initialData?.isDefault || false,
  });

  const availableModels = RECOMMENDED_MODELS[formData.provider];
  const needsBaseUrl = formData.provider === 'ollama' || formData.provider === 'custom';
  const needsApiKey = formData.provider !== 'ollama';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My OpenAI Key"
          required
        />
      </div>

      <div>
        <Label htmlFor="provider">Provider</Label>
        <Select
          value={formData.provider}
          onValueChange={(v: AIProviderType) => setFormData({ ...formData, provider: v, model: '' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="ollama">Ollama (Local)</SelectItem>
            <SelectItem value="custom">Custom (OpenAI-compatible)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {needsBaseUrl && (
        <div>
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input
            id="baseUrl"
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
            placeholder={formData.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com'}
            required
          />
        </div>
      )}

      {needsApiKey && (
        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="sk-..."
            required={!initialData?.apiKey}
          />
          {initialData?.apiKey && (
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to keep existing key
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="model">Model</Label>
        {availableModels.length > 0 ? (
          <Select
            value={formData.model}
            onValueChange={(v) => setFormData({ ...formData, model: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="model-name"
            required
          />
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
        />
        <Label htmlFor="isDefault">Set as default provider</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Add'} Provider
        </Button>
      </div>
    </form>
  );
}
```

**Step 2: Create AI provider list component**

Create `src/components/ai/AIProviderList.tsx`:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { AIProviderForm, type ProviderFormData } from './AIProviderForm';
import type { AIProvider } from '@/lib/db/schema';

interface AIProviderListProps {
  providers: AIProvider[];
  onAdd: (data: ProviderFormData) => void;
  onUpdate: (id: string, data: ProviderFormData) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function AIProviderList({
  providers,
  onAdd,
  onUpdate,
  onDelete,
  onSetDefault,
}: AIProviderListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = (data: ProviderFormData) => {
    onAdd(data);
    setIsAdding(false);
  };

  const handleUpdate = (id: string, data: ProviderFormData) => {
    onUpdate(id, data);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">AI Providers</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add AI Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <AIProviderForm
              onSubmit={handleAdd}
              onCancel={() => setIsAdding(false)}
            />
          </CardContent>
        </Card>
      )}

      {providers.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No AI providers configured.</p>
          <p className="text-sm">Add a provider to enable AI features.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((provider) => (
            <Card key={provider.id}>
              {editingId === provider.id ? (
                <CardContent className="pt-6">
                  <AIProviderForm
                    initialData={{
                      name: provider.name,
                      provider: provider.provider,
                      model: provider.model,
                      isDefault: provider.isDefault,
                    }}
                    onSubmit={(data) => handleUpdate(provider.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </CardContent>
              ) : (
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{provider.name}</span>
                        {provider.isDefault && (
                          <Badge variant="default" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {!provider.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {provider.provider} / {provider.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!provider.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetDefault(provider.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(provider.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(provider.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/ai/AIProviderForm.tsx src/components/ai/AIProviderList.tsx
git commit -m "feat(ui): add AI provider settings components"
```

---

## Task 11: Create AI Settings Page

**Files:**
- Create: `src/pages/settings/ai.astro`
- Modify: `src/components/layout/Sidebar.tsx` (add AI settings link)

**Step 1: Create AI settings page**

Create `src/pages/settings/ai.astro`:

```astro
---
import AppLayout from '@/layouts/AppLayout.astro';
import { AIProviderSettings } from '@/components/ai/AIProviderSettings';

const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/auth/login');
}
---

<AppLayout title="AI Settings | Personal Finance">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">AI Settings</h1>

    <div class="space-y-6">
      <AIProviderSettings client:load />

      <div class="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <h4 class="font-medium text-foreground mb-2">About AI Integration</h4>
        <ul class="list-disc list-inside space-y-1">
          <li>Your API keys are encrypted before storage</li>
          <li>AI conversations are stored per-household</li>
          <li>Financial context is only shared when you send a message</li>
          <li>You can use local models via Ollama for complete privacy</li>
        </ul>
      </div>
    </div>
  </div>
</AppLayout>
```

**Step 2: Create AIProviderSettings container**

Create `src/components/ai/AIProviderSettings.tsx`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIProviderList } from './AIProviderList';
import { AIProviderForm, type ProviderFormData } from './AIProviderForm';
import type { AIProvider } from '@/lib/db/schema';

export function AIProviderSettings() {
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const res = await fetch('/api/ai/providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      return res.json() as Promise<AIProvider[]>;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: ProviderFormData) => {
      const res = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add provider');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProviderFormData }) => {
      const res = await fetch(`/api/ai/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update provider');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai/providers/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete provider');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error('Failed to set default');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AIProviderList
      providers={providers}
      onAdd={(data) => addMutation.mutate(data)}
      onUpdate={(id, data) => updateMutation.mutate({ id, data })}
      onDelete={(id) => deleteMutation.mutate(id)}
      onSetDefault={(id) => setDefaultMutation.mutate(id)}
    />
  );
}
```

**Step 3: Commit**

```bash
git add src/pages/settings/ai.astro src/components/ai/AIProviderSettings.tsx
git commit -m "feat(ui): add AI settings page"
```

---

## Task 12: Create AI Chat Panel Component

**Files:**
- Create: `src/components/ai/AIChatPanel.tsx`
- Create: `src/components/ai/AIChatButton.tsx`

**Step 1: Create AI chat panel component**

Create `src/components/ai/AIChatPanel.tsx`:

```typescript
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useChat } from 'ai/react';
import type { AIMessage } from '@/lib/db/schema';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
}

export function AIChatPanel({ isOpen, onClose, conversationId }: AIChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/ai/chat',
    id: currentConversationId,
    onResponse: (response) => {
      const newConversationId = response.headers.get('X-Conversation-Id');
      if (newConversationId && !currentConversationId) {
        setCurrentConversationId(newConversationId);
      }
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything about your finances!</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <SuggestionChip text="What's my net worth?" onClick={() => handleInputChange({ target: { value: "What's my net worth?" } } as any)} />
                <SuggestionChip text="How much did I spend last month?" onClick={() => handleInputChange({ target: { value: "How much did I spend last month?" } } as any)} />
                <SuggestionChip text="What are my top spending categories?" onClick={() => handleInputChange({ target: { value: "What are my top spending categories?" } } as any)} />
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
              Error: {error.message}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your finances..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

function SuggestionChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-full transition-colors"
    >
      {text}
    </button>
  );
}
```

**Step 2: Create AI chat button**

Create `src/components/ai/AIChatButton.tsx`:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { AIChatPanel } from './AIChatPanel';

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      >
        <Bot className="w-6 h-6" />
      </Button>
      <AIChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

**Step 3: Install ai/react dependency**

Run:
```bash
npm install @ai-sdk/react
```

**Step 4: Commit**

```bash
git add src/components/ai/AIChatPanel.tsx src/components/ai/AIChatButton.tsx package.json package-lock.json
git commit -m "feat(ui): add AI chat panel with streaming support"
```

---

## Task 13: Add AI Chat to App Layout

**Files:**
- Modify: `src/layouts/AppLayout.astro`

**Step 1: Add AI chat button to layout**

Modify `src/layouts/AppLayout.astro` - add import and component:

```astro
---
import '@/styles/global.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { AIChatButton } from '@/components/ai/AIChatButton';

interface Props {
  title?: string;
}

const { title = 'Personal Finance' } = Astro.props;
const user = Astro.locals.user;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-background">
    <div class="flex h-screen">
      <!-- Sidebar -->
      <aside class="w-60 flex-shrink-0">
        <Sidebar user={user} client:load />
      </aside>

      <!-- Main content -->
      <main class="flex-1 overflow-auto">
        <div class="p-8">
          <slot />
        </div>
      </main>
    </div>

    <!-- AI Chat Button -->
    <AIChatButton client:load />
  </body>
</html>
```

**Step 2: Commit**

```bash
git add src/layouts/AppLayout.astro
git commit -m "feat(ui): add AI chat button to app layout"
```

---

## Task 14: Create AI Auto-Categorization API

**Files:**
- Create: `src/pages/api/ai/categorize.ts`

**Step 1: Create categorization endpoint**

Create `src/pages/api/ai/categorize.ts`:

```typescript
import type { APIRoute } from 'astro';
import { generateText } from 'ai';
import { db } from '@/lib/db';
import { getDefaultProvider, createLanguageModel } from '@/lib/ai/provider';
import { json, unauthorized } from '@/lib/api/response';

interface CategorizeRequest {
  descriptions: string[];
  categories: Array<{ id: string; name: string; keywords?: string[] }>;
}

interface CategorizeResponse {
  suggestions: Array<{
    description: string;
    categoryId: string;
    confidence: number;
    reasoning: string;
  }>;
}

const CATEGORIZE_PROMPT = `You are a financial transaction categorizer. Given transaction descriptions and available categories, suggest the best category for each transaction.

Available Categories:
{categories}

Transactions to categorize:
{descriptions}

Respond with a JSON array in this exact format:
[
  {
    "description": "exact description from input",
    "categoryId": "id of suggested category",
    "confidence": 0.95,
    "reasoning": "brief explanation of why this category fits"
  }
]

Rules:
- Use only the provided category IDs
- Confidence should be 0.0 to 1.0
- If uncertain, choose the most general category with lower confidence
- Consider keywords in category names and descriptions`;

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  try {
    const body: CategorizeRequest = await request.json();
    const { descriptions, categories } = body;

    if (!descriptions?.length || !categories?.length) {
      return json({ error: 'Descriptions and categories are required' }, { status: 400 });
    }

    // Get AI provider
    const providerConfig = await getDefaultProvider(user.householdId);
    if (!providerConfig) {
      return json({
        error: 'No AI provider configured',
        code: 'NO_PROVIDER'
      }, { status: 400 });
    }

    // Build prompt
    const categoriesText = categories.map(c =>
      `- ${c.id}: ${c.name}${c.keywords ? ` (keywords: ${c.keywords.join(', ')})` : ''}`
    ).join('\n');

    const descriptionsText = descriptions.map((d, i) => `${i + 1}. "${d}"`).join('\n');

    const prompt = CATEGORIZE_PROMPT
      .replace('{categories}', categoriesText)
      .replace('{descriptions}', descriptionsText);

    // Generate categorization
    const model = createLanguageModel(providerConfig);

    const result = await generateText({
      model,
      prompt,
      maxTokens: 2000,
    });

    // Parse response
    try {
      const suggestions = JSON.parse(result.text);
      return json({ suggestions });
    } catch (e) {
      console.error('Failed to parse AI response:', result.text);
      return json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error('Categorization error:', error);
    return json({ error: 'Failed to categorize transactions' }, { status: 500 });
  }
};
```

**Step 2: Commit**

```bash
git add src/pages/api/ai/categorize.ts
git commit -m "feat(api): add AI auto-categorization endpoint"
```

---

## Task 15: Create AI Insights API

**Files:**
- Create: `src/pages/api/ai/insights.ts`

**Step 1: Create insights endpoint**

Create `src/pages/api/ai/insights.ts`:

```typescript
import type { APIRoute } from 'astro';
import { generateText } from 'ai';
import { db } from '@/lib/db';
import { getDefaultProvider, createLanguageModel } from '@/lib/ai/provider';
import { buildFinancialContext, formatContextForPrompt } from '@/lib/ai/context-builder';
import { json, unauthorized } from '@/lib/api/response';

const INSIGHTS_PROMPT = `You are a financial advisor AI. Analyze the user's financial data and provide 3-5 actionable insights.

{context}

Provide insights in this JSON format:
{
  "insights": [
    {
      "type": "spending" | "saving" | "investment" | "debt" | "general",
      "title": "Brief insight title",
      "description": "Detailed explanation with specific numbers",
      "actionable": "Specific action the user can take",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Guidelines:
- Focus on patterns and trends in the data
- Be specific with numbers and percentages
- Prioritize high-impact insights
- Include both positive observations and areas for improvement
- Make actionable advice concrete and achievable`;

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  try {
    // Get AI provider
    const providerConfig = await getDefaultProvider(user.householdId);
    if (!providerConfig) {
      return json({
        error: 'No AI provider configured',
        code: 'NO_PROVIDER'
      }, { status: 400 });
    }

    // Build context
    const financialContext = await buildFinancialContext(user.householdId);
    const contextString = formatContextForPrompt(financialContext);

    // Generate insights
    const model = createLanguageModel(providerConfig);

    const result = await generateText({
      model,
      prompt: INSIGHTS_PROMPT.replace('{context}', contextString),
      maxTokens: 2000,
    });

    // Parse response
    try {
      const parsed = JSON.parse(result.text);
      return json(parsed);
    } catch (e) {
      console.error('Failed to parse AI response:', result.text);
      return json({
        error: 'Failed to parse AI response',
        raw: result.text
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Insights error:', error);
    return json({ error: 'Failed to generate insights' }, { status: 500 });
  }
};
```

**Step 2: Commit**

```bash
git add src/pages/api/ai/insights.ts
git commit -m "feat(api): add AI insights generation endpoint"
```

---

## Task 16: Create AI Insights Dashboard Widget

**Files:**
- Create: `src/components/ai/AIInsightsWidget.tsx`

**Step 1: Create insights widget**

Create `src/components/ai/AIInsightsWidget.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Lightbulb, TrendingDown, TrendingUp, PiggyBank, AlertCircle } from 'lucide-react';

interface Insight {
  type: 'spending' | 'saving' | 'investment' | 'debt' | 'general';
  title: string;
  description: string;
  actionable: string;
  priority: 'high' | 'medium' | 'low';
}

interface InsightsResponse {
  insights: Insight[];
}

const typeIcons = {
  spending: TrendingDown,
  saving: PiggyBank,
  investment: TrendingUp,
  debt: AlertCircle,
  general: Lightbulb,
};

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

export function AIInsightsWidget() {
  const { data, isLoading, error, refetch } = useQuery<InsightsResponse>({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const res = await fetch('/api/ai/insights');
      if (!res.ok) throw new Error('Failed to fetch insights');
      return res.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error.message === 'No AI provider configured'
              ? 'Configure an AI provider in settings to see insights.'
              : 'Failed to load insights. Try again later.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const insights = data?.insights || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Insights
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-muted-foreground text-sm">No insights available yet.</p>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const Icon = typeIcons[insight.type];
              return (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge variant="secondary" className={`text-xs ${priorityColors[insight.priority]}`}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Action:</span> {insight.actionable}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ai/AIInsightsWidget.tsx
git commit -m "feat(ui): add AI insights dashboard widget"
```

---

## Task 17: Create AI Budget Suggestions API

**Files:**
- Create: `src/pages/api/ai/budget-suggestions.ts`

**Step 1: Create budget suggestions endpoint**

Create `src/pages/api/ai/budget-suggestions.ts`:

```typescript
import type { APIRoute } from 'astro';
import { generateText } from 'ai';
import { db } from '@/lib/db';
import { getDefaultProvider, createLanguageModel } from '@/lib/ai/provider';
import { buildFinancialContext, formatContextForPrompt } from '@/lib/ai/context-builder';
import { json, unauthorized } from '@/lib/api/response';

const BUDGET_PROMPT = `You are a budgeting expert. Analyze the user's spending history and suggest realistic monthly budget amounts for each category.

{context}

Current budgets (if any):
{currentBudgets}

Suggest budgets in this JSON format:
{
  "suggestions": [
    {
      "category": "Category name",
      "suggestedAmount": 500,
      "rationale": "Why this amount is appropriate",
      "confidence": 0.85
    }
  ],
  "overallAssessment": "General feedback on spending vs income",
  "potentialSavings": 200
}

Guidelines:
- Suggest amounts based on actual spending patterns
- Account for income and necessary savings
- Be realistic - don't suggest cuts that are unsustainable
- Consider seasonal variations if data shows them
- Confidence should reflect data quality`;

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  try {
    const body = await request.json();
    const { currentBudgets = [] } = body;

    // Get AI provider
    const providerConfig = await getDefaultProvider(user.householdId);
    if (!providerConfig) {
      return json({
        error: 'No AI provider configured',
        code: 'NO_PROVIDER'
      }, { status: 400 });
    }

    // Build context
    const financialContext = await buildFinancialContext(user.householdId);
    const contextString = formatContextForPrompt(financialContext);

    const budgetsText = currentBudgets.length > 0
      ? currentBudgets.map((b: any) => `- ${b.category}: $${b.amount}`).join('\n')
      : 'No current budgets set';

    // Generate suggestions
    const model = createLanguageModel(providerConfig);

    const result = await generateText({
      model,
      prompt: BUDGET_PROMPT
        .replace('{context}', contextString)
        .replace('{currentBudgets}', budgetsText),
      maxTokens: 2000,
    });

    // Parse response
    try {
      const parsed = JSON.parse(result.text);
      return json(parsed);
    } catch (e) {
      console.error('Failed to parse AI response:', result.text);
      return json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error('Budget suggestions error:', error);
    return json({ error: 'Failed to generate budget suggestions' }, { status: 500 });
  }
};
```

**Step 2: Commit**

```bash
git add src/pages/api/ai/budget-suggestions.ts
git commit -m "feat(api): add AI budget suggestions endpoint"
```

---

## Task 18: Create AI Retirement Projections API

**Files:**
- Create: `src/pages/api/ai/retirement-projection.ts`

**Step 1: Create retirement projection endpoint**

Create `src/pages/api/ai/retirement-projection.ts`:

```typescript
import type { APIRoute } from 'astro';
import { generateText } from 'ai';
import { db } from '@/lib/db';
import { getDefaultProvider, createLanguageModel } from '@/lib/ai/provider';
import { buildFinancialContext, formatContextForPrompt } from '@/lib/ai/context-builder';
import { json, unauthorized } from '@/lib/api/response';

const RETIREMENT_PROMPT = `You are a retirement planning expert. Analyze the user's financial situation and provide retirement projections.

{context}

User Profile:
- Current Age: {age}
- Target Retirement Age: {targetRetirementAge}
- Risk Tolerance: {riskTolerance}
- Annual Income: {annualIncome}

Provide analysis in this JSON format:
{
  "projections": {
    "yearsToRetirement": 25,
    "projectedRetirementSavings": 2500000,
    "requiredMonthlySavings": 1500,
    "currentMonthlySavingsRate": 800,
    "savingsGap": 700
  },
  "assessments": [
    {
      "area": "savings rate" | "asset allocation" | "timeline" | "income",
      "status": "on_track" | "needs_attention" | "at_risk",
      "message": "Description of the assessment"
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "action": "Specific action to take",
      "impact": "Expected impact on retirement outcome"
    }
  ],
  "scenarios": {
    "conservative": { "projectedSavings": 2000000, "successProbability": 0.85 },
    "moderate": { "projectedSavings": 2500000, "successProbability": 0.75 },
    "aggressive": { "projectedSavings": 3200000, "successProbability": 0.60 }
  }
}

Assume:
- Conservative return: 4% annually
- Moderate return: 6% annually
- Aggressive return: 8% annually
- Safe withdrawal rate: 4%
- Inflation: 3% annually`;

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
    with: {
      financialProfile: true,
    },
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  try {
    // Get AI provider
    const providerConfig = await getDefaultProvider(user.householdId);
    if (!providerConfig) {
      return json({
        error: 'No AI provider configured',
        code: 'NO_PROVIDER'
      }, { status: 400 });
    }

    // Build context
    const financialContext = await buildFinancialContext(user.householdId);
    const contextString = formatContextForPrompt(financialContext);

    const profile = user.financialProfile;
    const age = profile?.dateOfBirth
      ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 30;

    // Generate projection
    const model = createLanguageModel(providerConfig);

    const result = await generateText({
      model,
      prompt: RETIREMENT_PROMPT
        .replace('{context}', contextString)
        .replace('{age}', age.toString())
        .replace('{targetRetirementAge}', profile?.targetRetirementAge?.toString() || '65')
        .replace('{riskTolerance}', profile?.riskTolerance || 'moderate')
        .replace('{annualIncome}', profile?.annualIncome?.toString() || '0'),
      maxTokens: 2500,
    });

    // Parse response
    try {
      const parsed = JSON.parse(result.text);
      return json(parsed);
    } catch (e) {
      console.error('Failed to parse AI response:', result.text);
      return json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error('Retirement projection error:', error);
    return json({ error: 'Failed to generate retirement projection' }, { status: 500 });
  }
};
```

**Step 2: Commit**

```bash
git add src/pages/api/ai/retirement-projection.ts
git commit -m "feat(api): add AI retirement projections endpoint"
```

---

## Task 19: Test the Build

**Step 1: Run build to verify all code compiles**

Run:
```bash
npm run build
```

Expected: Build completes successfully with no errors

**Step 2: Commit any fixes if needed**

If there are TypeScript errors, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve TypeScript errors in AI integration"
```

---

## Summary

Phase 6 implementation adds:

1. **Database Layer**: AIProvider and AIConversation schemas with encrypted API keys
2. **API Layer**: 8 API endpoints for providers, conversations, chat, categorization, insights, budgets, and retirement
3. **Service Layer**: Provider abstraction, encryption, context builder
4. **UI Layer**: Settings page, chat panel, insights widget
5. **Integration**: AI chat button in app layout

**Key Features:**
- Multi-provider support (OpenAI, Anthropic, Ollama, Custom)
- Encrypted API key storage
- Streaming chat with financial context
- Auto-categorization for transactions
- AI-generated insights
- Budget suggestions
- Retirement projections

**Next Steps After Phase 6:**
- Phase 7: API Integrations (external data sources)
- Phase 8: Polish & PWA (mobile responsiveness, offline support)
