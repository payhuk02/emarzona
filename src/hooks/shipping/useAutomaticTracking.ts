/**
 * Hook pour le Tracking Automatique des Colis
 * Date: 31 Janvier 2025
 * 
 * Utilise le système de tracking automatique pour mettre à jour les statuts
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackShipment, trackPendingShipments, sendTrackingNotifications } from '@/lib/shipping/automatic-tracking';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * Hook pour tracker un shipment spécifique
 */
export function useTrackShipment(shipmentId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!shipmentId) {
        throw new Error('Shipment ID is required');
      }
      return trackShipment(shipmentId);
    },
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] });
        queryClient.invalidateQueries({ queryKey: ['shipments'] });
        toast({
          title: '✅ Tracking mis à jour',
          description: 'Le statut du colis a été mis à jour avec succès.',
        });
      } else {
        toast({
          title: '⚠️ Erreur de tracking',
          description: 'Impossible de mettre à jour le statut du colis.',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      logger.error('Error tracking shipment', { error, shipmentId });
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du tracking',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook pour tracker tous les shipments en attente
 */
export function useTrackPendingShipments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackPendingShipments,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast({
        title: '✅ Tracking mis à jour',
        description: `${result.success} colis mis à jour, ${result.failed} échecs.`,
      });
    },
    onError: (error) => {
      logger.error('Error tracking pending shipments', { error });
      toast({
        title: '❌ Erreur',
        description: 'Erreur lors du tracking des colis',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook pour envoyer les notifications de tracking
 */
export function useSendTrackingNotifications() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: sendTrackingNotifications,
    onSuccess: () => {
      toast({
        title: '✅ Notification envoyée',
        description: 'Le client a été notifié de la mise à jour.',
      });
    },
    onError: (error) => {
      logger.error('Error sending tracking notifications', { error });
      toast({
        title: '⚠️ Erreur',
        description: 'Impossible d\'envoyer la notification',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook pour le tracking automatique périodique
 * Utilise un interval pour tracker automatiquement les shipments
 */
export function useAutomaticTracking(intervalMs: number = 5 * 60 * 1000) {
  const { mutate: trackPending } = useTrackPendingShipments();

  // Démarrer le tracking automatique
  React.useEffect(() => {
    // Track immédiatement
    trackPending();

    // Puis toutes les X minutes
    const interval = setInterval(() => {
      trackPending();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [trackPending, intervalMs]);
}

