import { QueryProvider } from './providers/QueryProvider';
import type { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

/**
 * PageWrapper ensures all React components have access to QueryClient.
 * This component should be used with client:only="react" directive in Astro.
 */
export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
