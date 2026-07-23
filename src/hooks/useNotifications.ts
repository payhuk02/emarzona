/**
 * Hooks pour le système de notifications
 * Gestion des notifications in-app, marquage lu/non-lu, real-time
 * Date : 27 octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { isSafeInternalNavUrl } from '@/lib/navigation/keyboard-shortcuts';
import { playInAppNotificationAlert } from '@/lib/notifications/in-app-notification-alert';
import { isNotificationPaused } from '@/lib/notifications/notification-pause';
import { getVibrationPattern } from '@/lib/notifications/vibration-patterns';
import type { Json } from '@/integrations/supabase/types';
import type {
  Notification,
  CreateNotificationData,
  NotificationPreferences,
} from '@/types/notifications';
import { mergeNotificationPreferences } from '@/lib/notifications/notification-preferences-defaults';

const NOTIFICATION_PREFERENCES_FIELDS =
  'id, user_id, email_course_enrollment, email_lesson_complete, email_course_complete, email_certificate_ready, email_new_course, email_course_update, email_quiz_result, email_affiliate_sale, email_comment_reply, email_instructor_message, app_course_enrollment, app_lesson_complete, app_course_complete, app_certificate_ready, app_new_course, app_course_update, app_quiz_result, app_affiliate_sale, app_comment_reply, app_instructor_message, email_notifications, push_notifications, sms_notifications, email_digest_frequency, pause_until, sound_notifications, vibration_notifications, sound_volume, vibration_intensity, notification_sound_type, accessibility_mode, high_contrast_sounds, screen_reader_friendly, created_at, updated_at';

/**
 * Hook pour récupérer les notifications de l'utilisateur avec pagination
 */
export const useNotifications = (options?: {
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
  enabled?: boolean;
}) => {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const includeArchived = options?.includeArchived ?? false;
  const queryEnabled = options?.enabled ?? true;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['notifications', page, pageSize, includeArchived],
    enabled: queryEnabled,
    refetchInterval: () =>
      typeof document !== 'undefined' && document.visibilityState === 'visible' ? 90_000 : false,
    queryFn: async (): Promise<{ data: Notification[]; count: number }> => {
      let query = supabase
        .from('notifications')
        .select(
          'id,user_id,type,title,message,is_read,is_archived,metadata,action_url,action_label,priority,read_at,created_at,updated_at',
          { count: 'exact' }
        );

      // Si on n'inclut pas les archivées, filtrer
      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        // Table may not exist yet - return empty gracefully
        logger.warn('Error fetching notifications (table may not exist)', { error: error.message });
        return { data: [] as Notification[], count: 0 };
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
export const useUnreadCount = (options?: { enabled?: boolean }) => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    enabled,
    retry: false,
    queryFn: async (): Promise<number> => {
      try {
        const { data, error } = await supabase.rpc('get_unread_count');

        if (error) {
          // Fallback: count directly if RPC doesn't exist
          logger.warn('RPC get_unread_count failed, using fallback', { error: error.message });
          const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('is_read', false)
            .eq('is_archived', false);
          return count || 0;
        }

        return data || 0;
      } catch (err) {
        logger.error('Error fetching unread count', { error: err });
        return 0;
      }
    },
    refetchInterval: () =>
      typeof document !== 'undefined' && document.visibilityState === 'visible' ? 30_000 : false,
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
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
      // Contournement du RLS pour les administrateurs
      const { error } = await supabase.rpc('admin_create_notification', {
        p_user_id: data.user_id,
        p_type: data.type,
        p_title: data.title,
        p_message: data.message,
        p_metadata: (data.metadata || {}) as Json,
        p_action_url: data.action_url,
        p_action_label: data.action_label,
        p_priority: data.priority || 'normal',
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
        return mergeNotificationPreferences(null);
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select(NOTIFICATION_PREFERENCES_FIELDS)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        logger.warn('Error fetching notification preferences (table may not exist)', {
          error: error.message,
        });
        return mergeNotificationPreferences(null);
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
          return mergeNotificationPreferences(null);
        }

        return mergeNotificationPreferences(newPrefs as NotificationPreferences);
      }

      return mergeNotificationPreferences(data as NotificationPreferences);
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

      const {
        id: _id,
        user_id: _userId,
        created_at: _createdAt,
        updated_at: _updatedAt,
        ...patch
      } = preferences;

      const { error } = await supabase
        .from('notification_preferences')
        .update(patch)
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
export const useRealtimeNotifications = (options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionEnabled = options?.enabled ?? true;

  // Récupérer les préférences utilisateur pour les sons et vibrations
  const { data: preferences } = useNotificationPreferences();

  useEffect(() => {
    if (!subscriptionEnabled) return;

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
            // Invalider le cache pour rafraîchir liste + badge non-lus
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

            const notif = payload.new as Notification;
            const paused = isNotificationPaused(preferences?.pause_until);

            if (paused) return;

            const osNotificationGranted =
              'Notification' in window && Notification.permission === 'granted';
            const shouldPlaySound = preferences?.sound_notifications !== false;
            const shouldVibrate = preferences?.vibration_notifications !== false;

            if (osNotificationGranted) {
              const isOrderAlert = [
                'order_payment_received',
                'order_payment_failed',
                'physical_product_order_placed',
                'physical_order_paid',
                'physical_order_failed',
              ].includes(String(notif.type || ''));

              const notification = new Notification(notif.title, {
                body: notif.message,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                tag: notif.id || notif.type || 'default',
                data: {
                  notificationId: notif.id,
                  type: notif.type,
                  action_url: notif.action_url,
                },
                requireInteraction:
                  isOrderAlert || notif.priority === 'high' || notif.priority === 'urgent',
                silent: !shouldPlaySound,
                vibrate: getVibrationPattern(preferences?.vibration_intensity, shouldVibrate),
                timestamp: Date.now(),
              } as NotificationOptions);

              notification.onclick = event => {
                event.preventDefault();
                const rawUrl = notif.action_url?.trim();
                const target = rawUrl && isSafeInternalNavUrl(rawUrl) ? rawUrl : '/';
                window.focus();
                window.location.href = target;
                notification.close();
              };

              // Son Emarzona en plus du son OS (dual alert)
              if (shouldPlaySound) {
                playInAppNotificationAlert(preferences, {
                  forceInTabSound: true,
                  skipVibration: true,
                });
              }
            } else {
              playInAppNotificationAlert(preferences, { forceInTabSound: true });
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
  }, [
    queryClient,
    subscriptionEnabled,
    preferences?.sound_notifications,
    preferences?.vibration_notifications,
    preferences?.pause_until,
    preferences?.sound_volume,
    preferences?.notification_sound_type,
    preferences?.high_contrast_sounds,
  ]);

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
