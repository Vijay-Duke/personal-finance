import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query/client';
import { AnimatedDashboard } from './AnimatedDashboard';
import { useState } from 'react';

export function DashboardWrapper() {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatedDashboard />
    </QueryClientProvider>
  );
}
