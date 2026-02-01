import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query/client';
import { Dashboard } from './Dashboard';
import { useState } from 'react';

/**
 * DashboardWrapper provides the QueryClient context for the Dashboard.
 * This ensures the QueryClient is only created on the client side.
 */
export function DashboardWrapper() {
  // Only create query client on client side
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
