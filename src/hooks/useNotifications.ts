/**
 * Hooks pour le système de notifications
 * Gestion des notifications in-app, marquage lu/non-lu, real-time
 * Date : 27 octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';
import type {
  Notification,
  CreateNotificationData,
  NotificationPreferences,
} from '@/types/notifications';

/**
 * Hook pour récupérer les notifications de l'utilisateur avec pagination
 */
export const useNotifications = (options?: {
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
}) => {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const includeArchived = options?.includeArchived ?? false;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['notifications', page, pageSize, includeArchived],
    queryFn: async (): Promise<{ data: Notification[]; count: number }> => {
      let query = supabase.from('notifications').select('*', { count: 'exact' });

      // Si on n'inclut pas les archivées, filtrer
      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error('Error fetching notifications', { error, page, pageSize, includeArchived });
        throw new Error(error.message);
      }

      // Type assertion nécessaire car Supabase retourne des types plus larges
      return {
        data: (data || []) as Notification[],
        count: count || 0,
      };
    },
  });
};

/**
 * Hook pour compter les notifications non lues
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('get_unread_count');

      if (error) {
        logger.error('Error fetching unread count', { error });
        return 0;
      }

      return data || 0;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });
};

/**
 * Hook pour marquer une notification comme lue
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Invalider les requêtes pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Hook pour marquer toutes les notifications comme lues
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Hook pour archiver une notification
 */
export const useArchiveNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('archive_notification', {
        notification_id: notificationId,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Hook pour supprimer une notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Hook pour créer une notification (admin/système uniquement)
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNotificationData) => {
      const { error } = await supabase.from('notifications').insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: (data.metadata || {}) as Json,
        action_url: data.action_url,
        action_label: data.action_label,
        priority: data.priority || 'normal',
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * Hook pour récupérer les préférences de notifications
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async (): Promise<NotificationPreferences | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching notification preferences', { error });
        throw new Error(error.message);
      }

      // Si pas de préférences, créer par défaut
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          logger.error('Error creating notification preferences', { error: insertError });
          return null;
        }

        return newPrefs as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
  });
};

/**
 * Hook pour mettre à jour les préférences de notifications
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
};

/**
 * Hook pour s'abonner aux notifications en temps réel
 */
export const useRealtimeNotifications = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;

      // S'abonner aux nouvelles notifications
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          payload => {
            if (!isMounted) return;

            logger.info('New notification received', {
              notificationId: payload.new?.id,
              type: payload.new?.type,
            });
            // Invalider le cache pour rafraîchir
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            // Afficher une notification browser avec son et vibration
            if ('Notification' in window && Notification.permission === 'granted') {
              const notif = payload.new as Notification;
              const notification = new Notification(notif.title, {
                body: notif.message,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                tag: notif.type || 'default',
                data: {
                  notificationId: notif.id,
                  type: notif.type,
                  action_url: notif.action_url,
                },
                requireInteraction: false,
                silent: false, // ✅ SON ACTIVÉ - La notification fera du bruit
                vibrate: [200, 100, 200] as number[], // ✅ Vibration pour mobile (type assertion)
                timestamp: Date.now(),
              } as NotificationOptions);

              // Ouvrir l'application quand on clique sur la notification
              notification.onclick = event => {
                event.preventDefault();
                const url = notif.action_url || '/';
                window.focus();
                window.location.href = url;
                notification.close();
              };
            }
          }
        )
        .subscribe();

      if (isMounted) {
        setIsSubscribed(true);
      }
    };

    setupSubscription();

    // Cleanup function
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      setIsSubscribed(false);
    };
  }, [queryClient]);

  return { isSubscribed };
};

/**
 * Hook pour demander la permission des notifications browser
 */
export const useRequestNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      logger.warn('Browser does not support notifications');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  return { permission, requestPermission };
};
