/**
 * Hook useUnreadCount
 * Date: 28 octobre 2025
 *
 * Compte les messages non lus pour une commande
 * Utilise la fonction SQL get_unread_message_count
 *
 * LOT 1 Disk I/O: polling 5s/10s → 30s/45s (visible only) ;
 * useUnreadCounts: 1+N RPC → 1 query batch (réversible).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

/** Cap rows fetched for client-side unread aggregation (badge UX). */
const UNREAD_BATCH_ROW_CAP = 2000;

const visibleRefetchInterval = (ms: number) => () =>
  typeof document !== 'undefined' && document.visibilityState === 'visible' ? ms : false;

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
      const { data, error } = await supabase.rpc('get_unread_message_count', {
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
    refetchInterval: visibleRefetchInterval(30_000),
    staleTime: 25_000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook pour plusieurs commandes (optimisé — batch SELECT, pas N RPC)
 */
export const useUnreadCounts = (orderIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-counts', orderIds, user?.id],
    queryFn: async () => {
      if (!user?.id || orderIds.length === 0) return {};

      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, order_id')
        .in('order_id', orderIds);

      if (convError || !conversations?.length) return {};

      const conversationIds = conversations.map(c => c.id);
      const orderIdByConv = new Map(conversations.map(c => [c.id, c.order_id]));

      const counts: Record<string, number> = {};
      for (const orderId of orderIds) {
        counts[orderId] = 0;
      }

      const { data: unreadRows, error: unreadError } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('is_read', false)
        .limit(UNREAD_BATCH_ROW_CAP);

      if (unreadError) {
        logger.error('Error batch-fetching unread messages', { error: unreadError });
        return counts;
      }

      for (const row of unreadRows || []) {
        const orderId = orderIdByConv.get(row.conversation_id);
        if (orderId) {
          counts[orderId] = (counts[orderId] || 0) + 1;
        }
      }

      if ((unreadRows?.length ?? 0) >= UNREAD_BATCH_ROW_CAP) {
        logger.warn('Unread batch hit row cap — counts may be understated', {
          cap: UNREAD_BATCH_ROW_CAP,
          conversationCount: conversationIds.length,
        });
      }

      return counts;
    },
    enabled: !!user?.id && orderIds.length > 0,
    refetchInterval: visibleRefetchInterval(45_000),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
};
