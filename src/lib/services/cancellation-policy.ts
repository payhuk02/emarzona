/**
 * Système de Politique d'Annulation pour Services
 * Date: 3 Février 2025
 *
 * Gestion des politiques d'annulation et calcul automatique des remboursements
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface RefundRule {
  hours_before: number;
  refund_percentage: number;
  description?: string;
}

export interface ServiceCancellationPolicy {
  id: string;
  product_id: string;
  store_id: string;
  policy_name: string;
  refund_rules: RefundRule[];
  allow_same_day_cancellation: boolean;
  same_day_refund_percentage: number;
  allow_emergency_cancellation: boolean;
  emergency_refund_percentage: number;
  emergency_reasons: string[];
  cancellation_fee_enabled: boolean;
  cancellation_fee_amount: number;
  cancellation_fee_percentage: number;
  allow_store_credit: boolean;
  store_credit_bonus_percentage: number;
  refund_processing_days: number;
  auto_refund_enabled: boolean;
  auto_refund_minimum_hours: number;
  is_active: boolean;
  is_default: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RefundCalculation {
  refund_percentage: number;
  refund_amount: number;
  cancellation_fee: number;
  net_refund_amount: number;
  hours_before_service: number;
  applicable_rule: RefundRule | null;
}

export interface ServiceCancellationRefund {
  id: string;
  booking_id: string;
  policy_id?: string;
  original_amount: number;
  refund_percentage: number;
  refund_amount: number;
  cancellation_fee: number;
  net_refund_amount: number;
  refund_method: 'original_payment' | 'store_credit' | 'bank_transfer' | 'check';
  hours_before_service: number;
  cancellation_reason?: string;
  is_emergency: boolean;
  emergency_reason?: string;
  original_order_id?: string;
  original_payment_id?: string;
  refund_transaction_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  admin_notes?: string;
  customer_notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =====================================================
// FONCTIONS
// =====================================================

/**
 * Récupère la politique d'annulation pour un service
 */
export async function getServiceCancellationPolicy(
  productId: string
): Promise<ServiceCancellationPolicy | null> {
  const { data, error } = await supabase
    .from('service_cancellation_policies')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (error) {
    logger.error('Error fetching cancellation policy', { error, productId });
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    refund_rules: (data.refund_rules as RefundRule[]) || [],
  } as ServiceCancellationPolicy;
}

/**
 * Calcule le remboursement pour une annulation
 */
export async function calculateServiceRefund(
  bookingId: string,
  cancellationReason?: string,
  isEmergency: boolean = false
): Promise<RefundCalculation> {
  const { data, error } = await supabase.rpc('calculate_service_refund', {
    p_booking_id: bookingId,
    p_cancellation_reason: cancellationReason || null,
    p_is_emergency: isEmergency,
  });

  if (error) {
    logger.error('Error calculating service refund', { error, bookingId });
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No refund calculation returned');
  }

  const result = data[0];

  return {
    refund_percentage: result.refund_percentage,
    refund_amount: result.refund_amount,
    cancellation_fee: result.cancellation_fee || 0,
    net_refund_amount: result.net_refund_amount,
    hours_before_service: result.hours_before_service,
    applicable_rule: result.applicable_rule || null,
  };
}

/**
 * Crée une demande de remboursement
 */
export async function createServiceRefund(
  bookingId: string,
  refundMethod:
    | 'original_payment'
    | 'store_credit'
    | 'bank_transfer'
    | 'check' = 'original_payment',
  cancellationReason?: string,
  isEmergency: boolean = false,
  emergencyReason?: string
): Promise<ServiceCancellationRefund> {
  // Calculer le remboursement
  const calculation = await calculateServiceRefund(bookingId, cancellationReason, isEmergency);

  // Récupérer les infos de la réservation
  const { data: booking, error: bookingError } = await supabase
    .from('service_bookings')
    .select(
      `
      *,
      products!inner (id, price, store_id),
      orders:order_items!inner (
        order_id,
        orders!inner (id, total_amount)
      )
    `
    )
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  // Récupérer la politique
  const policy = await getServiceCancellationPolicy(booking.product_id);

  // Récupérer le montant original depuis la commande ou le prix du service
  const orderAmount = (booking.orders as { orders?: { total_amount?: number } }[] | null)?.[0]
    ?.orders?.total_amount;
  const servicePrice = (booking.products as { price?: number } | null)?.price;
  const originalAmount = orderAmount || servicePrice || 0;

  // Créer le remboursement
  const { data: refund, error: refundError } = await supabase
    .from('service_cancellation_refunds')
    .insert({
      booking_id: bookingId,
      policy_id: policy?.id,
      original_amount: originalAmount,
      refund_percentage: calculation.refund_percentage,
      refund_amount: calculation.refund_amount,
      cancellation_fee: calculation.cancellation_fee,
      net_refund_amount: calculation.net_refund_amount,
      refund_method: refundMethod,
      hours_before_service: calculation.hours_before_service,
      cancellation_reason: cancellationReason,
      is_emergency: isEmergency,
      emergency_reason: emergencyReason,
      original_order_id: (booking.orders as { order_id?: string }[] | null)?.[0]?.order_id,
      status: 'pending',
    })
    .select()
    .single();

  if (refundError) {
    logger.error('Error creating service refund', { error: refundError, bookingId });
    throw refundError;
  }

  // Si auto-refund est activé et conditions remplies, traiter automatiquement
  if (
    policy?.auto_refund_enabled &&
    calculation.hours_before_service >= policy.auto_refund_minimum_hours
  ) {
    await processServiceRefund(refund.id).catch(err => {
      logger.warn('Error processing auto-refund', { error: err, refundId: refund.id });
    });
  }

  return refund as ServiceCancellationRefund;
}

/**
 * Traite un remboursement (appelle l'API de paiement)
 */
export async function processServiceRefund(refundId: string): Promise<ServiceCancellationRefund> {
  // Récupérer le remboursement
  const { data: refund, error: refundError } = await supabase
    .from('service_cancellation_refunds')
    .select('*')
    .eq('id', refundId)
    .single();

  if (refundError || !refund) {
    throw new Error('Refund not found');
  }

  if (refund.status !== 'pending') {
    throw new Error(`Refund is not pending (current status: ${refund.status})`);
  }

  // Mettre à jour le statut à "processing"
  const { data: updatedRefund, error: updateError } = await supabase
    .from('service_cancellation_refunds')
    .update({
      status: 'processing',
      processed_at: new Date().toISOString(),
    })
    .eq('id', refundId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  try {
    // Appeler l'API de remboursement (Moneroo ou PayDunya)
    // TODO: Implémenter l'appel réel à l'API de paiement
    const refundTransactionId = await processPaymentRefund(
      refund.original_payment_id || '',
      refund.net_refund_amount,
      refund.refund_method
    );

    // Mettre à jour avec le succès
    const { data: completedRefund, error: completeError } = await supabase
      .from('service_cancellation_refunds')
      .update({
        status: 'completed',
        refund_transaction_id: refundTransactionId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (completeError) {
      throw completeError;
    }

    // Mettre à jour la réservation
    await supabase
      .from('service_bookings')
      .update({
        refund_issued: true,
        refund_amount: refund.net_refund_amount,
      })
      .eq('id', refund.booking_id);

    return completedRefund as ServiceCancellationRefund;
  } catch (error) {
    // Marquer comme échoué
    await supabase
      .from('service_cancellation_refunds')
      .update({
        status: 'failed',
        admin_notes: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', refundId);

    throw error;
  }
}

/**
 * Traite le remboursement via l'API de paiement
 */
async function processPaymentRefund(
  paymentId: string,
  amount: number,
  method: string
): Promise<string> {
  // TODO: Implémenter l'appel réel à Moneroo ou PayDunya
  // Pour l'instant, retourner un ID fictif
  logger.info('Processing payment refund', { paymentId, amount, method });

  // Simuler un délai
  await new Promise(resolve => setTimeout(resolve, 1000));

  return `refund_${Date.now()}`;
}

/**
 * Récupère les remboursements pour une réservation
 */
export async function getServiceRefunds(bookingId: string): Promise<ServiceCancellationRefund[]> {
  const { data, error } = await supabase
    .from('service_cancellation_refunds')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching service refunds', { error, bookingId });
    throw error;
  }

  return (data || []) as ServiceCancellationRefund[];
}

/**
 * Récupère les remboursements pour un store
 */
export async function getStoreServiceRefunds(
  storeId: string,
  status?: string
): Promise<ServiceCancellationRefund[]> {
  let query = supabase
    .from('service_cancellation_refunds')
    .select(
      `
      *,
      booking:service_bookings!inner (
        product_id,
        products!inner (store_id)
      )
    `
    )
    .eq('booking.products.store_id', storeId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching store service refunds', { error, storeId });
    throw error;
  }

  return (data || []) as ServiceCancellationRefund[];
}
