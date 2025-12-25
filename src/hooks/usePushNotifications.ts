/**
 * Hook React pour gérer les notifications push
 */

import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService, type PushNotification, type NotificationPermission } from '@/lib/notifications/push';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showLocalNotification: (notification: PushNotification) => Promise<void>;
}

/**
 * Hook pour gérer les notifications push
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>({
    permission: 'default',
    canRequest: false,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Vérifier le support et l'état initial
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        const currentPermission = pushNotificationService.getPermissionStatus();
        setPermission(currentPermission);

        // Vérifier si l'utilisateur est déjà abonné
        checkSubscription();
      }
    };

    checkSupport();

    // Écouter les changements de permission
    if ('Notification' in window) {
      const interval = setInterval(() => {
        const currentPermission = pushNotificationService.getPermissionStatus();
        setPermission(currentPermission);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  // Vérifier si l'utilisateur est abonné
  const checkSubscription = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      logger.error('Error checking subscription', { error });
    }
  };

  // Demander la permission
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await pushNotificationService.requestPermission();
      
      const newPermission = pushNotificationService.getPermissionStatus();
      setPermission(newPermission);

      if (result === 'granted') {
        toast({
          title: 'Permission accordée',
          description: 'Vous recevrez maintenant les notifications push.',
        });
      } else if (result === 'denied') {
        toast({
          title: 'Permission refusée',
          description: 'Les notifications push ont été désactivées. Vous pouvez les activer dans les paramètres de votre navigateur.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Error requesting permission', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de demander la permission pour les notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // S'abonner aux notifications push
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Vérifier la permission d'abord
      const currentPermission = pushNotificationService.getPermissionStatus();
      if (currentPermission.permission !== 'granted') {
        await requestPermission();
      }

      // Initialiser le service
      const success = await pushNotificationService.initialize();
      
      if (success) {
        setIsSubscribed(true);
        toast({
          title: 'Abonnement réussi',
          description: 'Vous recevrez maintenant les notifications push.',
        });
      } else {
        toast({
          title: 'Échec de l\'abonnement',
          description: 'Impossible de s\'abonner aux notifications push.',
          variant: 'destructive',
        });
      }

      return success;
    } catch (error) {
      logger.error('Error subscribing to push notifications', { error });
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'abonnement.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission, toast]);

  // Se désabonner des notifications push
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Désabonnement réussi',
          description: 'Vous ne recevrez plus de notifications push.',
        });
      }

      return success;
    } catch (error) {
      logger.error('Error unsubscribing from push notifications', { error });
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du désabonnement.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Afficher une notification locale
  const showLocalNotification = useCallback(async (notification: PushNotification) => {
    try {
      await pushNotificationService.showLocalNotification(notification);
    } catch (error) {
      logger.error('Error showing local notification', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'afficher la notification.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
}







