import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils/cn';
import {
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatStatus {
  configured: boolean;
  hasActiveProvider: boolean;
  defaultProvider: {
    id: string;
    name: string;
    provider: string;
    model: string;
  } | null;
  totalProviders: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatStatus, setChatStatus] = useState<ChatStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch chat status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/ai/chat');
        if (res.ok) {
          const data = await res.json();
          setChatStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch chat status:', err);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    // Capture current messages to avoid race condition with state updates
    const currentMessages = [...messages, userMessage];

    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || data.message || 'No response',
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const setSuggestion = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

  const isConfigured = chatStatus?.hasActiveProvider;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <Card className="relative w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              {chatStatus?.defaultProvider && (
                <p className="text-xs text-text-muted">
                  Using {chatStatus.defaultProvider.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-text-muted hover:text-text-primary"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {statusLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : !isConfigured ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-primary">
                  AI Not Configured
                </h3>
                <p className="text-sm text-text-muted mt-1 max-w-sm">
                  You need to configure an AI provider before you can use the chat feature.
                </p>
              </div>
              <Button asChild>
                <a href="/settings/ai">Configure AI Provider</a>
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Bot className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-primary">
                  How can I help you today?
                </h3>
                <p className="text-sm text-text-muted mt-1 max-w-sm">
                  Ask me anything about your finances, investments, or budget. I have access to your financial data.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <SuggestionChip
                  text="What's my net worth?"
                  onClick={() => setSuggestion("What's my net worth?")}
                />
                <SuggestionChip
                  text="Analyze my spending"
                  onClick={() => setSuggestion("Analyze my spending patterns")}
                />
                <SuggestionChip
                  text="Investment advice"
                  onClick={() => setSuggestion("Give me investment advice")}
                />
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessageBubble
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
                  <p className="font-medium">Error</p>
                  <p>{error.message || 'Something went wrong. Please try again.'}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Input Area */}
        {isConfigured && (
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your finances..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-text-muted mt-2 text-center">
              AI responses are generated based on your financial data. Always verify important information.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function ChatMessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-primary-100 text-primary-600'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'rounded-lg px-4 py-2 max-w-[80%]',
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-content-bg border border-border'
        )}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {content.split('\n').map((line, i) => (
            <p key={i} className={cn('mb-1 last:mb-0', !line && 'h-4')}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-content-bg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-border hover:text-text-primary transition-colors"
    >
      {text}
    </button>
  );
}
