import { useAuth } from '@/contexts/AuthContext';
import { useDeferredMount } from '@/hooks/useDeferredMount';
import { useRealtimeNotifications } from '@/hooks/useNotifications';

/**
 * Abonnement Realtime + son/vibration sur toutes les pages authentifiées
 * (vendeur sur back-office, acheteur sur espace client, etc.).
 */
export function AuthenticatedRealtimeNotifications() {
  const { user, loading } = useAuth();
  const enabled = useDeferredMount(!loading && !!user, 500);

  useRealtimeNotifications({ enabled });

  return null;
}
