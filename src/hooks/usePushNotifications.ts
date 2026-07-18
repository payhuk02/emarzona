/**
 * Hook React pour gérer les notifications push
 */

import { useState, useEffect, useCallback } from 'react';
import {
  pushNotificationService,
  PushSubscribeError,
  type PushNotification,
  type NotificationPermission,
} from '@/lib/notifications/push';
import { isVapidConfigured } from '@/lib/notifications/vapid';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  isVapidReady: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  subscribe: (options?: { silent?: boolean }) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showLocalNotification: (notification: PushNotification) => Promise<void>;
}

function mapSubscribeError(error: unknown): string {
  if (error instanceof PushSubscribeError) {
    switch (error.code) {
      case 'VAPID_NOT_CONFIGURED':
        return error.message;
      case 'NOT_AUTHENTICATED':
        return error.message;
      case 'PERMISSION_DENIED':
        return error.message;
      case 'SAVE_FAILED':
        return "Impossible d'enregistrer l'abonnement. Vérifiez votre connexion et réessayez.";
      case 'SUBSCRIBE_FAILED':
        return "Le navigateur a refusé l'abonnement push. Réessayez ou utilisez Chrome/Firefox récent.";
      default:
        return error.message;
    }
  }
  return "Impossible de s'abonner aux notifications push.";
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>({
    permission: 'default',
    canRequest: false,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const isVapidReady = isVapidConfigured();

  const refreshPermission = useCallback(() => {
    setPermission(pushNotificationService.getPermissionStatus());
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      if (!pushNotificationService.isSupported()) return;
      const subscription = await pushNotificationService.getExistingSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      logger.error('Error checking subscription', { error });
    }
  }, []);

  useEffect(() => {
    const supported = pushNotificationService.isSupported();
    setIsSupported(supported);
    if (supported) {
      refreshPermission();
      void checkSubscription();
    }
  }, [refreshPermission, checkSubscription]);

  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await pushNotificationService.requestPermission();
      refreshPermission();

      if (result === 'granted') {
        toast({
          title: 'Permission accordée',
          description: "Cliquez sur Activer pour finaliser l'abonnement push.",
        });
      } else if (result === 'denied') {
        toast({
          title: 'Permission refusée',
          description: 'Activez les notifications dans les paramètres de votre navigateur.',
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
  }, [toast, refreshPermission]);

  const subscribe = useCallback(
    async (options?: { silent?: boolean }): Promise<boolean> => {
      const silent = options?.silent ?? false;
      try {
        setIsLoading(true);

        if (!isVapidConfigured()) {
          if (!silent) {
            toast({
              title: 'Configuration requise',
              description:
                'Les notifications push ne sont pas encore activées sur la plateforme (clé VAPID).',
              variant: 'destructive',
            });
          }
          return false;
        }

        let perm = pushNotificationService.getPermissionStatus().permission;
        if (perm !== 'granted') {
          perm = await pushNotificationService.requestPermission();
          refreshPermission();
        }

        if (perm !== 'granted') {
          if (!silent) {
            toast({
              title: 'Permission requise',
              description: 'Autorisez les notifications pour continuer.',
              variant: 'destructive',
            });
          }
          return false;
        }

        await pushNotificationService.subscribe();
        setIsSubscribed(true);
        if (!silent) {
          toast({
            title: 'Abonnement réussi',
            description: 'Vous recevrez maintenant les notifications push.',
          });
        }
        return true;
      } catch (error) {
        logger.error('Error subscribing to push notifications', { error });
        if (!silent) {
          toast({
            title: "Échec de l'abonnement",
            description: mapSubscribeError(error),
            variant: 'destructive',
          });
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, refreshPermission]
  );

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

  const showLocalNotification = useCallback(
    async (notification: PushNotification) => {
      try {
        await pushNotificationService.showLocalNotification(notification);
      } catch (error) {
        logger.error('Error showing local notification', { error });
        toast({
          title: 'Erreur',
          description: "Impossible d'afficher la notification.",
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  return {
    permission,
    isSupported,
    isVapidReady,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
}
