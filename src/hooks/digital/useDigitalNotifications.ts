/**
 * Digital Product Notifications Hooks
 * Date: 2025-01-27
 * 
 * Hooks React Query pour gérer les notifications email automatiques
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  sendPriceDropNotification,
  sendNewVersionNotification,
  sendLicenseExpiringNotification,
  sendLicenseExpiredNotification,
  checkAndSendPriceDropNotifications,
  checkAndSendLicenseExpiringNotifications,
  type PriceDropNotification,
  type NewVersionNotification,
  type LicenseExpiringNotification,
  type LicenseExpiredNotification,
} from '@/utils/digitalNotifications';

// =====================================================
// HOOKS
// =====================================================

/**
 * Hook pour envoyer une notification de baisse de prix
 */
export const useSendPriceDropNotification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: PriceDropNotification) => {
      return await sendPriceDropNotification(notification);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Notification envoyée',
          description: 'L\'email de baisse de prix a été envoyé avec succès',
        });
        queryClient.invalidateQueries({ queryKey: ['priceDropAlerts'] });
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible d\'envoyer la notification',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      logger.error('Erreur lors de l\'envoi de la notification de baisse de prix', { error });
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour envoyer une notification de nouvelle version
 */
export const useSendNewVersionNotification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: NewVersionNotification) => {
      return await sendNewVersionNotification(notification);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Notifications envoyées',
          description: 'Les emails de nouvelle version ont été envoyés aux clients',
        });
        queryClient.invalidateQueries({ queryKey: ['productVersions'] });
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible d\'envoyer les notifications',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      logger.error('Erreur lors de l\'envoi des notifications de nouvelle version', { error });
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour envoyer une notification de licence expirant
 */
export const useSendLicenseExpiringNotification = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notification: LicenseExpiringNotification) => {
      return await sendLicenseExpiringNotification(notification);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Notification envoyée',
          description: 'L\'email de licence expirant a été envoyé avec succès',
        });
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible d\'envoyer la notification',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      logger.error('Erreur lors de l\'envoi de la notification de licence expirant', { error });
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour envoyer une notification de licence expirée
 */
export const useSendLicenseExpiredNotification = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notification: LicenseExpiredNotification) => {
      return await sendLicenseExpiredNotification(notification);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Notification envoyée',
          description: 'L\'email de licence expirée a été envoyé avec succès',
        });
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible d\'envoyer la notification',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      logger.error('Erreur lors de l\'envoi de la notification de licence expirée', { error });
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour vérifier et envoyer les notifications de baisse de prix (batch)
 * À utiliser dans un cron job ou scheduler
 */
export const useCheckPriceDropNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await checkAndSendPriceDropNotifications();
    },
    onSuccess: (result) => {
      toast({
        title: 'Vérification terminée',
        description: `${result.sent} notification(s) envoyée(s), ${result.errors} erreur(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ['priceDropAlerts'] });
    },
    onError: (error: Error) => {
      logger.error('Erreur lors de la vérification des alertes de baisse de prix', { error });
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour vérifier et envoyer les notifications de licences expirant (batch)
 * À utiliser dans un cron job ou scheduler
 */
export const useCheckLicenseExpiringNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await checkAndSendLicenseExpiringNotifications();
    },
    onSuccess: (result) => {
      toast({
        title: 'Vérification terminée',
        description: `${result.sent} notification(s) envoyée(s), ${result.errors} erreur(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ['digitalLicenses'] });
    },
    onError: (error: Error) => {
      logger.error('Erreur lors de la vérification des licences expirant', { error });
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

