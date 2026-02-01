import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query/client';
import { ToastProvider } from '@/components/ui/toast';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

/**
 * PageWrapper ensures all React components have access to QueryClient and Toast.
 * This component should be used with client:only="react" directive in Astro.
 *
 * IMPORTANT: In Astro, when using client:only="react", you cannot pass children
 * from Astro templates. Instead, create a specific wrapper component that imports
 * both this wrapper AND the content component.
 *
 * Example:
 * ```tsx
 * // BankAccountsPage.tsx
 * export function BankAccountsPage() {
 *   return (
 *     <PageWrapper>
 *       <BankAccountsList />
 *     </PageWrapper>
 *   );
 * }
 * ```
 *
 * Then in Astro:
 * ```astro
 * <BankAccountsPage client:only="react" />
 * ```
 */
export function PageWrapper({ children }: PageWrapperProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
