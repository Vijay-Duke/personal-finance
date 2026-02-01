import { QueryClient } from '@tanstack/react-query';

/**
 * Creates a new QueryClient with default options optimized for financial data.
 *
 * Default behavior:
 * - staleTime: 5 minutes - Financial data doesn't need real-time updates
 * - gcTime: 30 minutes - Keep data in cache for quick navigation
 * - refetchOnWindowFocus: false - Avoid unnecessary API calls
 * - retry: 1 - Retry once on failure
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        retry: 1,
        refetchOnMount: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

// Singleton for client-side usage
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Get or create the QueryClient for browser usage.
 * Uses a singleton pattern to ensure consistent caching.
 */
export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient();
  }

  // Browser: use singleton
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
