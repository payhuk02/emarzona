import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { checkUserIsAdmin } from '@/lib/auth-redirect';

export const useAdmin = () => {
  const { user } = useAuth();

  const {
    data: isAdmin,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user-is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      return checkUserIsAdmin(user.id, user.email);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    isAdmin: isError ? false : (isAdmin ?? false),
    isLoading: !!user?.id && isLoading,
  };
};
