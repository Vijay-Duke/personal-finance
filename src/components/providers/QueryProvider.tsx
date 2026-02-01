import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query/client';
import type { ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider wrapper for React islands in Astro.
 * Provides TanStack Query context for data fetching and caching.
 *
 * Usage in Astro components:
 * ```astro
 * ---
 * import { QueryProvider } from '@/components/providers/QueryProvider';
 * import { MyDataComponent } from '@/components/MyDataComponent';
 * ---
 *
 * <QueryProvider client:load>
 *   <MyDataComponent />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
