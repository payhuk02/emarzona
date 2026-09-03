import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the current authenticated user's id (or null) with a global cache.
 * This avoids calling `supabase.auth.getUser()` in every card/component on mobile lists.
 */
export function useCurrentUserId() {
  const query = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async (): Promise<string | null> => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) return null;
      return user?.id ?? null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    userId: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
