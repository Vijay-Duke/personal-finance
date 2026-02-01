import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Query keys for cache management.
 * Organized hierarchically for easy invalidation.
 */
export const queryKeys = {
  // Dashboard
  dashboard: ['dashboard'] as const,
  netWorth: ['dashboard', 'netWorth'] as const,

  // Accounts
  accounts: ['accounts'] as const,
  account: (id: string) => ['accounts', id] as const,
  accountsByType: (type: string) => ['accounts', 'type', type] as const,

  // Bank Accounts
  bankAccounts: ['accounts', 'type', 'bank_account'] as const,
  bankAccount: (id: string) => ['accounts', 'type', 'bank_account', id] as const,

  // Stocks
  stocks: ['accounts', 'type', 'stock'] as const,
  stock: (id: string) => ['accounts', 'type', 'stock', id] as const,

  // Crypto
  crypto: ['accounts', 'type', 'crypto'] as const,
  cryptoAsset: (id: string) => ['accounts', 'type', 'crypto', id] as const,

  // Transactions
  transactions: ['transactions'] as const,
  transaction: (id: string) => ['transactions', id] as const,
  transactionsByAccount: (accountId: string) => ['transactions', 'account', accountId] as const,
  transactionsByCategory: (categoryId: string) => ['transactions', 'category', categoryId] as const,

  // Categories
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,

  // Budgets
  budgets: ['budgets'] as const,
  budgetsByMonth: (month: string) => ['budgets', 'month', month] as const,

  // Goals
  goals: ['goals'] as const,
  goal: (id: string) => ['goals', id] as const,

  // User
  user: ['user'] as const,
  household: ['household'] as const,
};

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Hook for fetching data from an API endpoint.
 */
export function useApiQuery<T>(
  key: readonly unknown[],
  url: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: () => fetchApi<T>(url),
    ...options,
  });
}

/**
 * Hook for mutations (POST, PUT, DELETE).
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    invalidateKeys?: readonly (readonly unknown[])[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate specified query keys
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      options?.onSuccess?.(data, variables);
    },
  });
}

export { useQuery, useMutation, useQueryClient };
