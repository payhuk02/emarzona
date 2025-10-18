import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const useAdmin = () => {
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['user-is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        logger.error('Error checking admin status:', error);
        return false;
      }

      return !!data;
    },
  });

  return {
    isAdmin: isAdmin ?? false,
    isLoading,
  };
};
