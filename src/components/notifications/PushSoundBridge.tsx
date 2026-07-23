import { useEffect } from 'react';
import { playInAppNotificationAlert } from '@/lib/notifications/in-app-notification-alert';
import { useNotificationPreferences } from '@/hooks/useNotifications';

/**
 * Joue le son plateforme quand le Service Worker reçoit un Web Push
 * (onglet ouvert en arrière-plan, ou clients non focusés).
 */
export function PushSoundBridge() {
  const { data: preferences } = useNotificationPreferences();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'EMARZONA_PLAY_NOTIFICATION_SOUND') return;
      if (event.data?.soundEnabled === false) return;
      playInAppNotificationAlert(preferences, { forceInTabSound: true });
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [preferences]);

  return null;
}
