import { type ReactNode, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query/client';
import { ToastProvider } from '@/components/ui/toast';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Combined providers wrapper for the application.
 * Includes:
 * - TanStack Query for data fetching
 * - Toast notifications system
 *
 * Usage in Astro layouts:
 * ```astro
 * <AppProviders client:load>
 *   <YourComponents />
 * </AppProviders>
 * ```
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
