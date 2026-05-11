import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const useAdmin = () => {
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['user-is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Vérifier dans user_roles via la fonction sécurisée has_role
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

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
