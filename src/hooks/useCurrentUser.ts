import { useApiQuery } from './useApi';

interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  householdId: string | null;
  image: string | null;
}

/**
 * Hook to get the current user with role convenience booleans.
 * Fetches from the household members endpoint and finds the current user.
 */
export function useCurrentUser() {
  const { data, isLoading, error } = useApiQuery<CurrentUser>(
    ['currentUser'],
    '/api/auth/me'
  );

  return {
    user: data ?? null,
    isLoading,
    error,
    isSuperAdmin: data?.role === 'super_admin',
    isOwner: data?.role === 'owner' || data?.role === 'super_admin',
    isMember: data?.role === 'member',
  };
}
