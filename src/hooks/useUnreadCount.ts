/**
 * Hook useUnreadCount
 * Date: 28 octobre 2025
 * 
 * Compte les messages non lus pour une commande
 * Utilise la fonction SQL get_unread_message_count
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export const useUnreadCount = (orderId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-count', orderId, user?.id],
    queryFn: async () => {
      if (!user?.id || !orderId) return 0;

      // Récupérer la conversation pour cette commande
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('order_id', orderId)
        .single();

      if (convError || !conversation) return 0;

      // Utiliser la fonction SQL pour compter les messages non lus
      const { data, error } = await supabase
        .rpc('get_unread_message_count', {
          conversation_id_param: conversation.id,
          user_id_param: user.id,
        });

      if (error) {
        logger.error('Error fetching unread count', { error, orderId, userId: user.id });
        return 0;
      }

      return data || 0;
    },
    enabled: !!user?.id && !!orderId,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 3000, // Consider stale after 3s
  });
};

/**
 * Hook pour plusieurs commandes (optimisé)
 */
export const useUnreadCounts = (orderIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-counts', orderIds, user?.id],
    queryFn: async () => {
      if (!user?.id || orderIds.length === 0) return {};

      // Récupérer toutes les conversations pour ces commandes
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, order_id')
        .in('order_id', orderIds);

      if (convError || !conversations) return {};

      // Compter les messages non lus pour chaque conversation
      const counts: Record<string, number> = {};

      for (const conv of conversations) {
        const { data } = await supabase
          .rpc('get_unread_message_count', {
            conversation_id_param: conv.id,
            user_id_param: user.id,
          });

        counts[conv.order_id] = data || 0;
      }

      return counts;
    },
    enabled: !!user?.id && orderIds.length > 0,
    refetchInterval: 10000, // Refresh every 10 seconds for batch
    staleTime: 5000,
  });
};

