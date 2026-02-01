/**
 * POST /api/ai/chat
 * Chat with AI about your finances
 *
 * GET /api/ai/chat
 * Get chat status (whether AI is configured)
 */

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { aiProviders } from '../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, unauthorized } from '../../../lib/api/response';
import { decrypt } from '../../../lib/ai/encryption';

/**
 * GET /api/ai/chat
 * Get chat status - whether AI is configured and available
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    // Check if user has any active AI providers
    const providers = await db
      .select({
        id: aiProviders.id,
        name: aiProviders.name,
        provider: aiProviders.provider,
        model: aiProviders.model,
        isDefault: aiProviders.isDefault,
      })
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.householdId, session.user.householdId),
          eq(aiProviders.isActive, true)
        )
      );

    const defaultProvider = providers.find(p => p.isDefault) || providers[0];

    return json({
      configured: providers.length > 0,
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        provider: p.provider,
        model: p.model,
        isDefault: p.isDefault,
      })),
      defaultProvider: defaultProvider || null,
    });
  } catch (err) {
    console.error('Error fetching chat status:', err);
    return error('Failed to fetch chat status', 500);
  }
};

/**
 * POST /api/ai/chat
 * Send messages to AI and get a response
 *
 * Request body:
 * - messages: Array<{ role: 'user' | 'assistant', content: string }>
 * - providerId?: string (optional, uses default if not specified)
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();
    const { messages, providerId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return error('Messages array is required', 400);
    }

    // Get the AI provider to use
    let provider;
    if (providerId) {
      [provider] = await db
        .select()
        .from(aiProviders)
        .where(
          and(
            eq(aiProviders.id, providerId),
            eq(aiProviders.householdId, session.user.householdId),
            eq(aiProviders.isActive, true)
          )
        )
        .limit(1);
    } else {
      // Use default provider
      [provider] = await db
        .select()
        .from(aiProviders)
        .where(
          and(
            eq(aiProviders.householdId, session.user.householdId),
            eq(aiProviders.isActive, true),
            eq(aiProviders.isDefault, true)
          )
        )
        .limit(1);

      // Fallback to any active provider
      if (!provider) {
        [provider] = await db
          .select()
          .from(aiProviders)
          .where(
            and(
              eq(aiProviders.householdId, session.user.householdId),
              eq(aiProviders.isActive, true)
            )
          )
          .limit(1);
      }
    }

    if (!provider) {
      return error('No AI provider configured. Please add one in Settings > AI Providers.', 400);
    }

    // Decrypt API key
    let apiKey: string | undefined;
    if (provider.apiKey) {
      try {
        apiKey = decrypt(provider.apiKey);
      } catch (decryptErr) {
        console.error('Failed to decrypt API key:', decryptErr);
        return error('Failed to decrypt API key. Please reconfigure the provider.', 500);
      }
    }

    // Build system prompt for financial assistant
    const systemPrompt = `You are a helpful financial assistant for a personal finance application.
You help users understand their finances, answer questions about budgeting, investments, and financial planning.
Be concise and helpful. When discussing money, use appropriate currency formatting.
You don't have access to the user's actual financial data in this conversation, but you can provide general financial advice and guidance.`;

    // Call the appropriate AI provider
    let response: string;

    try {
      if (provider.provider === 'openai') {
        response = await callOpenAI(apiKey!, provider.model, systemPrompt, messages, provider.baseUrl);
      } else if (provider.provider === 'anthropic') {
        response = await callAnthropic(apiKey!, provider.model, systemPrompt, messages, provider.baseUrl);
      } else if (provider.provider === 'ollama') {
        response = await callOllama(provider.model, systemPrompt, messages, provider.baseUrl || 'http://localhost:11434');
      } else {
        // Custom provider - try OpenAI-compatible API
        response = await callOpenAI(apiKey!, provider.model, systemPrompt, messages, provider.baseUrl);
      }
    } catch (aiErr) {
      console.error('AI provider error:', aiErr);
      const message = aiErr instanceof Error ? aiErr.message : 'Unknown AI error';
      return error(`AI provider error: ${message}`, 502);
    }

    return json({ response, provider: provider.name });
  } catch (err) {
    console.error('Error in chat endpoint:', err);
    return error('Failed to process chat request', 500);
  }
};

/**
 * Call OpenAI API (or OpenAI-compatible)
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  baseUrl?: string | null
): Promise<string> {
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`
    : 'https://api.openai.com/v1/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response generated';
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  baseUrl?: string | null
): Promise<string> {
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/v1/messages`
    : 'https://api.anthropic.com/v1/messages';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'No response generated';
}

/**
 * Call Ollama API (local)
 */
async function callOllama(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  baseUrl: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/chat`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Ollama API error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return data.message?.content || 'No response generated';
}
