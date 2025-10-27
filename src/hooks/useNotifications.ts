/**
 * Hooks pour le système de notifications
 * Gestion des notifications in-app, marquage lu/non-lu, real-time
 * Date : 27 octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import type { Notification, CreateNotificationData, NotificationPreferences } from '@/types/notifications';

/**
 * Hook pour récupérer les notifications de l'utilisateur
 */
export const useNotifications = (limit = 50) => {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error(error.message);
      }

      return data || [];
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
        console.error('Error fetching unread count:', error);
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
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

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
        metadata: data.metadata || {},
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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
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
          console.error('Error creating notification preferences:', insertError);
          return null;
        }

        return newPrefs;
      }

      return data;
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
      const { data: { user } } = await supabase.auth.getUser();

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
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // S'abonner aux nouvelles notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('📬 New notification received:', payload);
            // Invalider le cache pour rafraîchir
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            
            // Optionnel : Afficher une notification browser
            if ('Notification' in window && Notification.permission === 'granted') {
              const notif = payload.new as Notification;
              new Notification(notif.title, {
                body: notif.message,
                icon: '/logo.png',
              });
            }
          }
        )
        .subscribe();

      setIsSubscribed(true);

      // Cleanup
      return () => {
        channel.unsubscribe();
        setIsSubscribed(false);
      };
    };

    setupSubscription();
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
      console.log('Browser does not support notifications');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  return { permission, requestPermission };
};

