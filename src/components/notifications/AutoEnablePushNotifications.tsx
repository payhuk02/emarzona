import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeferredMount } from '@/hooks/useDeferredMount';
import { useNotificationPreferences } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  hasAutoEnablePushBeenAttempted,
  markAutoEnablePushAttempted,
  shouldAutoEnablePush,
} from '@/lib/notifications/auto-enable-push';
import { pushNotificationService } from '@/lib/notifications/push';
import { logger } from '@/lib/logger';

/**
 * Opt-in push automatique à la connexion lorsque les préférences l'autorisent.
 * Permet les alertes sonores / écran même app fermée (via Service Worker + VAPID).
 */
export function AutoEnablePushNotifications() {
  const { user, loading } = useAuth();
  const enabled = useDeferredMount(!loading && !!user, 1500);
  const { data: preferences } = useNotificationPreferences();
  const { isSupported, isVapidReady, isSubscribed, permission } = usePushNotifications();

  useEffect(() => {
    if (!enabled || !user?.id || !preferences) return;

    const input = {
      userId: user.id,
      pushNotificationsEnabled: preferences.push_notifications,
      isSupported,
      isVapidReady,
      permission: permission.permission,
      isSubscribed,
      alreadyAttemptedThisSession: hasAutoEnablePushBeenAttempted(user.id),
    };

    if (!shouldAutoEnablePush(input)) return;

    markAutoEnablePushAttempted(user.id);

    void (async () => {
      try {
        const ok = await pushNotificationService.initialize();
        if (!ok) {
          logger.debug('Auto-enable push skipped or declined', { userId: user.id });
        }
      } catch (error) {
        logger.warn('Auto-enable push failed', { error, userId: user.id });
      }
    })();
  }, [
    enabled,
    user?.id,
    preferences,
    preferences?.push_notifications,
    isSupported,
    isVapidReady,
    isSubscribed,
    permission.permission,
  ]);

  return null;
}
