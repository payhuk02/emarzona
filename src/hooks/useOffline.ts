/**
 * Hook pour gérer le mode hors-ligne
 */

import { useState, useEffect } from 'react';
import { isOnline, watchNetworkStatus } from '@/lib/pwa';
import { useToast } from '@/hooks/use-toast';

export function useOffline() {
  const [online, setOnline] = useState(isOnline());
  const { toast } = useToast();

  useEffect(() => {
    const cleanup = watchNetworkStatus(
      () => {
        setOnline(true);
        toast({
          title: 'Connexion rétablie',
          description: 'Vous êtes de nouveau en ligne',
          variant: 'default',
        });
      },
      () => {
        setOnline(false);
        toast({
          title: 'Hors ligne',
          description: 'Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.',
          variant: 'destructive',
        });
      }
    );

    return cleanup;
  }, [toast]);

  return {
    isOnline: online,
    isOffline: !online,
  };
}

/**
 * Hook pour gérer le Service Worker
 */
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Écouter les mises à jour
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (registration) {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    registration,
    updateAvailable,
    updateServiceWorker,
  };
}

/**
 * Hook pour les notifications
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isSupported, setIsSupported] = useState('Notification' in window);

  const requestPermission = async () => {
    if (!isSupported) {
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
  };
}

