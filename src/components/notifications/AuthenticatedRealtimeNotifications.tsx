import { useAuth } from '@/contexts/AuthContext';
import { useDeferredMount } from '@/hooks/useDeferredMount';
import { useRealtimeNotifications } from '@/hooks/useNotifications';
import { useNotificationBadgeSync } from '@/hooks/useNotificationBadgeSync';
import { AutoEnablePushNotifications } from '@/components/notifications/AutoEnablePushNotifications';
import { PushSoundBridge } from '@/components/notifications/PushSoundBridge';

/**
 * Abonnement Realtime + son/vibration + push auto + badge sur toutes les pages authentifiées.
 */
export function AuthenticatedRealtimeNotifications() {
  const { user, loading } = useAuth();
  const enabled = useDeferredMount(!loading && !!user, 500);

  useRealtimeNotifications({ enabled });
  useNotificationBadgeSync({ enabled });

  return (
    <>
      <AutoEnablePushNotifications />
      <PushSoundBridge />
    </>
  );
}
