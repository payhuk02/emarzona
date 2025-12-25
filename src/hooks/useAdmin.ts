import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Email de l'administrateur principal avec accès complet
const PRINCIPAL_ADMIN_EMAIL = 'contact@edigit-agence.com';

export const useAdmin = () => {
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['user-is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Vérifier si c'est l'administrateur principal
      if (user.email === PRINCIPAL_ADMIN_EMAIL) {
        logger.info('Principal admin detected:', user.email);
        return true;
      }

      // Vérifier dans user_roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .limit(1);

      if (error) {
        logger.error('Error checking admin status:', error);
        return false;
      }

      return !!(data && data.length > 0);
    },
  });

  return {
    isAdmin: isAdmin ?? false,
    isLoading,
  };
};
