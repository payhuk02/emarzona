/**
 * Hooks pour Gestion des Politiques d'Annulation
 * Date: 3 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  getServiceCancellationPolicy,
  calculateServiceRefund,
  createServiceRefund,
  processServiceRefund,
  getServiceRefunds,
  type ServiceCancellationPolicy,
  type RefundCalculation,
  type ServiceCancellationRefund,
} from '@/lib/services/cancellation-policy';

/**
 * Récupère la politique d'annulation pour un service
 */
export function useServiceCancellationPolicy(productId: string) {
  return useQuery({
    queryKey: ['service-cancellation-policy', productId],
    queryFn: () => getServiceCancellationPolicy(productId),
    enabled: !!productId,
  });
}

/**
 * Calcule le remboursement pour une annulation
 */
export function useCalculateServiceRefund() {
  return useMutation({
    mutationFn: async ({
      bookingId,
      cancellationReason,
      isEmergency,
    }: {
      bookingId: string;
      cancellationReason?: string;
      isEmergency?: boolean;
    }) => {
      return calculateServiceRefund(bookingId, cancellationReason, isEmergency);
    },
  });
}

/**
 * Crée une demande de remboursement
 */
export function useCreateServiceRefund() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      bookingId,
      refundMethod,
      cancellationReason,
      isEmergency,
      emergencyReason,
    }: {
      bookingId: string;
      refundMethod?: 'original_payment' | 'store_credit' | 'bank_transfer' | 'check';
      cancellationReason?: string;
      isEmergency?: boolean;
      emergencyReason?: string;
    }) => {
      return createServiceRefund(
        bookingId,
        refundMethod || 'original_payment',
        cancellationReason,
        isEmergency,
        emergencyReason
      );
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['service-refunds', data.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });

      toast({
        title: '✅ Demande de remboursement créée',
        description: `Un remboursement de ${data.net_refund_amount.toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'XOF',
        })} a été créé.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la demande de remboursement',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Traite un remboursement
 */
export function useProcessServiceRefund() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (refundId: string) => processServiceRefund(refundId),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['service-refunds', data.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['service-refunds'] });

      toast({
        title: '✅ Remboursement traité',
        description: 'Le remboursement a été traité avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de traiter le remboursement',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Récupère les remboursements pour une réservation
 */
export function useServiceRefunds(bookingId: string) {
  return useQuery({
    queryKey: ['service-refunds', bookingId],
    queryFn: () => getServiceRefunds(bookingId),
    enabled: !!bookingId,
  });
}

/**
 * Crée ou met à jour une politique d'annulation
 */
export function useUpsertCancellationPolicy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      policy: Partial<ServiceCancellationPolicy> & { product_id: string; store_id: string }
    ) => {
      const { data, error } = await supabase
        .from('service_cancellation_policies')
        .upsert(policy, {
          onConflict: 'product_id',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting cancellation policy', { error });
        throw error;
      }

      return data as ServiceCancellationPolicy;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['service-cancellation-policy', data.product_id] });
      toast({
        title: '✅ Politique sauvegardée',
        description: "La politique d'annulation a été sauvegardée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder la politique',
        variant: 'destructive',
      });
    },
  });
}







