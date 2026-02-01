import { useState } from 'react';
import { AIProviderList } from './AIProviderList';
import { AIProviderForm } from './AIProviderForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useQuery } from '@tanstack/react-query';
import { Bot, MessageSquare, Lightbulb, Sparkles } from 'lucide-react';

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

export function AIProviderSettings() {
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: chatStatus } = useQuery<ChatStatus>({
    queryKey: ['ai-chat-status'],
    queryFn: async () => {
      const res = await fetch('/api/ai/chat');
      if (!res.ok) throw new Error('Failed to fetch chat status');
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* AI Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            AI Features
          </CardTitle>
          <CardDescription>
            AI-powered features available in your personal finance app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-content-bg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">AI Chat</h3>
                <p className="text-sm text-text-muted mt-1">
                  Ask questions about your finances, get insights, and receive personalized advice.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-content-bg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">Smart Insights</h3>
                <p className="text-sm text-text-muted mt-1">
                  Get AI-generated insights about your spending patterns and investment opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-content-bg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">Auto-Categorization</h3>
                <p className="text-sm text-text-muted mt-1">
                  Automatically categorize transactions and identify recurring expenses.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      {chatStatus && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">AI Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  chatStatus.hasActiveProvider
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                }`}
              >
                {chatStatus.hasActiveProvider ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {chatStatus.hasActiveProvider
                    ? 'AI is ready to use'
                    : 'AI not configured'}
                </p>
                <p className="text-sm text-text-muted">
                  {chatStatus.hasActiveProvider
                    ? chatStatus.defaultProvider
                      ? `Using ${chatStatus.defaultProvider.name} (${chatStatus.defaultProvider.model})`
                      : 'Active provider available'
                    : 'Add an AI provider to enable AI features'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider List or Form */}
      {showAddForm ? (
        <AIProviderForm
          onCancel={() => setShowAddForm(false)}
          onSuccess={() => setShowAddForm(false)}
        />
      ) : (
        <AIProviderList onAddNew={() => setShowAddForm(true)} />
      )}
    </div>
  );
}
