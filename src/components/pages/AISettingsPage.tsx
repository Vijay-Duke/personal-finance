import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIProviderSettings } from '../ai/AIProviderSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function AISettingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Settings</h1>
          <p className="text-text-muted">
            Configure AI providers and manage AI-powered features for your personal finance app.
          </p>
        </div>

        {/* AI Provider Settings Component */}
        <AIProviderSettings />
      </div>
    </QueryClientProvider>
  );
}
