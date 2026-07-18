import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUnreadCount } from '@/hooks/useNotifications';
import {
  EMARZONA_UNREAD_COUNT_MESSAGE,
  isEmarzonaUnreadCountMessage,
  syncNotificationAppBadge,
} from '@/lib/notifications/notification-app-badge';

/**
 * Synchronise le badge PWA et rafraîchit le compteur cloche quand un push arrive (SW → client).
 */
export function useNotificationBadgeSync(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const queryClient = useQueryClient();
  const { data: unreadCount = 0 } = useUnreadCount({ enabled });

  useEffect(() => {
    if (!enabled) return;
    void syncNotificationAppBadge(unreadCount);
  }, [enabled, unreadCount]);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (!isEmarzonaUnreadCountMessage(event.data)) return;

      if (typeof event.data.unreadCount === 'number') {
        void syncNotificationAppBadge(event.data.unreadCount);
        queryClient.setQueryData(['notifications', 'unread-count'], event.data.unreadCount);
      } else {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [enabled, queryClient]);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [enabled, queryClient]);

  return { unreadCount };
}

export { EMARZONA_UNREAD_COUNT_MESSAGE };
