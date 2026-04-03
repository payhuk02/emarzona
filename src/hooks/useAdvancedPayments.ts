/**
 * useAdvancedPayments Hook (refactored)
 * Core logic extracted to src/services/advancedPaymentsService.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  AdvancedPayment,
  PaymentType,
  PaymentOptions,
  PercentagePaymentOptions,
  SecuredPaymentOptions,
  PaymentResponse,
  PaymentFilters,
  PaymentStats,
} from '@/types/advanced-features';
import { fetchAndMergePayments, fetchPaymentStats } from '@/services/advancedPaymentsService';

export const useAdvancedPayments = (
  storeId?: string,
  filters?: PaymentFilters,
  pagination?: { page?: number; pageSize?: number }
) => {
  const [payments, setPayments] = useState<AdvancedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 50;

  const fetchPayments = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    try {
      const result = await fetchAndMergePayments(storeId, filters, page, pageSize);
      setPayments(result.payments);
      setTotalCount(result.totalCount);
      setError(null);
    } catch (_error: unknown) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      setError(err);
      logger.error('Error fetching advanced payments:', { error: err.message, storeId });
      const isConnectionError = err.message.includes('upstream connect error') ||
        err.message.includes('connection timeout') || err.message.includes('network') ||
        err.message.includes('fetch failed');
      if (!isConnectionError) {
        toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }, [storeId, filters, toast, page, pageSize]);

  const fetchStats = useCallback(async () => {
    if (!storeId) return;
    try {
      const result = await fetchPaymentStats(storeId);
      setStats(result);
      setError(null);
    } catch (_error: unknown) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      setError(err);
      logger.error('Error fetching payment stats:', { error: err.message, storeId });
    }
  }, [storeId]);

  // Create standard payment
  const createPayment = async (options: PaymentOptions): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          store_id: options.storeId,
          order_id: options.orderId || null,
          customer_id: options.customerId || null,
          payment_method: options.paymentMethod || 'mobile_money',
          amount: options.amount,
          currency: options.currency || 'XOF',
          status: 'pending',
          payment_type: options.paymentType || 'full',
          transaction_id: options.transactionId || null,
          notes: options.notes || null,
          metadata: options.metadata as unknown,
        }] as unknown)
        .select().limit(1);

      if (error) throw error;
      await fetchPayments();
      await fetchStats();
      return {
        success: true,
        data: data?.[0] ? { ...data[0], order_id: data[0].order_id || undefined, customer_id: data[0].customer_id || undefined } as AdvancedPayment : undefined,
      };
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : String(_error);
      logger.error('Error creating payment:', { error: msg });
      return { success: false, error: msg };
    }
  };

  // Create percentage payment
  const createPercentagePayment = async (options: PercentagePaymentOptions): Promise<PaymentResponse> => {
    try {
      const percentageAmount = options.amount * (options.percentageRate / 100);
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          store_id: options.storeId, order_id: options.orderId, customer_id: options.customerId,
          payment_method: options.paymentMethod || 'mobile_money', amount: percentageAmount,
          currency: options.currency || 'XOF', status: 'completed', payment_type: 'percentage',
          percentage_amount: percentageAmount, percentage_rate: options.percentageRate,
          remaining_amount: options.remainingAmount, transaction_id: options.transactionId,
          notes: options.notes, metadata: options.metadata,
        }]).select().limit(1);

      if (error) throw error;

      if (options.orderId) {
        try {
          await supabase.from('partial_payments' as unknown as 'payments').insert([{
            order_id: options.orderId, payment_id: data[0].id, amount: percentageAmount,
            percentage: options.percentageRate, status: 'completed',
            payment_method: options.paymentMethod || 'mobile_money',
            transaction_id: options.transactionId || undefined,
          }]);
        } catch { /* table may not exist */ }
      }

      await fetchPayments();
      await fetchStats();
      return {
        success: true,
        data: data?.[0] ? { ...data[0], order_id: data[0].order_id || undefined, customer_id: data[0].customer_id || undefined } as AdvancedPayment : undefined,
      };
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : String(_error);
      logger.error('Error creating percentage payment:', { error: msg });
      return { success: false, error: msg };
    }
  };

  // Create secured payment
  const createSecuredPayment = async (options: SecuredPaymentOptions): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          store_id: options.storeId, order_id: options.orderId || null, customer_id: options.customerId || null,
          payment_method: options.paymentMethod || 'mobile_money', amount: options.amount,
          currency: options.currency || 'XOF', status: 'held', payment_type: 'delivery_secured',
          is_held: true, held_until: options.heldUntil || null,
          release_conditions: options.releaseConditions, transaction_id: options.transactionId || null,
          notes: options.notes || null, metadata: options.metadata,
        }]).select().limit(1);

      if (error) throw error;

      if (options.orderId) {
        try {
          await supabase.from('secured_payments' as unknown as 'payments').insert([{
            order_id: options.orderId, payment_id: data[0].id, total_amount: options.amount,
            held_amount: options.amount, status: 'held', hold_reason: options.holdReason,
            release_conditions: options.releaseConditions as unknown, held_until: options.heldUntil || undefined,
          }]);
        } catch { /* table may not exist */ }
      }

      await fetchPayments();
      await fetchStats();
      return {
        success: true,
        data: data?.[0] ? { ...data[0], order_id: data[0].order_id || undefined, customer_id: data[0].customer_id || undefined } as AdvancedPayment : undefined,
      };
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : String(_error);
      logger.error('Error creating secured payment:', { error: msg });
      return { success: false, error: msg };
    }
  };

  // Release held payment
  const releasePayment = async (paymentId: string, releasedBy: string): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'released', is_held: false, delivery_confirmed_at: new Date().toISOString(), delivery_confirmed_by: releasedBy })
        .eq('id', paymentId).select().limit(1);

      if (error) throw error;

      await supabase.from('secured_payments').update({ status: 'released', released_at: new Date().toISOString(), released_by: releasedBy }).eq('payment_id', paymentId);
      await fetchPayments();
      await fetchStats();
      toast({ title: 'Succès', description: 'Paiement libéré avec succès' });
      return {
        success: true,
        data: data?.[0] ? { ...data[0], order_id: data[0].order_id || undefined, customer_id: data[0].customer_id || undefined } as AdvancedPayment : undefined,
      };
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : String(_error);
      logger.error('Error releasing payment:', { error: msg });
      return { success: false, error: msg };
    }
  };

  // Open dispute
  const openDispute = async (paymentId: string, reason: string, description: string): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'disputed', dispute_opened_at: new Date().toISOString() })
        .eq('id', paymentId).select().limit(1);

      if (error) throw error;

      if (data[0].order_id) {
        try {
          await supabase.from('disputes').insert([{
            order_id: data[0].order_id, initiator_id: data[0].customer_id || '',
            initiator_type: 'customer', subject: reason, description, status: 'open',
          }]);
        } catch (e) { logger.warn('Error creating dispute (non-critical)', { error: e }); }
      }

      await fetchPayments();
      await fetchStats();
      toast({ title: 'Litige ouvert', description: 'Un litige a été ouvert pour ce paiement' });
      return {
        success: true,
        data: data?.[0] ? { ...data[0], order_id: data[0].order_id || undefined, customer_id: data[0].customer_id || undefined } as AdvancedPayment : undefined,
      };
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : String(_error);
      logger.error('Error opening dispute:', { error: msg });
      return { success: false, error: msg };
    }
  };

  // Update payment
  const updatePayment = async (id: string, updates: Partial<AdvancedPayment>): Promise<PaymentResponse> => {
    try {
      const supabaseUpdates: Record<string, unknown> = {
        ...updates,
        order_id: updates.order_id !== undefined ? updates.order_id || null : undefined,
        customer_id: updates.customer_id !== undefined ? updates.customer_id || null : undefined,
        release_conditions: updates.release_conditions ? (updates.release_conditions as unknown) : undefined,
      };
      const { data, error } = await supabase.from('payments').update(supabaseUpdates).eq('id', id).select().limit(1);
      if (error) throw error;
      await fetchPayments();
      await fetchStats();
      return {
        success: true,
        data: data?.[0] ? { ...data[0], order_id: data[0].order_id || undefined, customer_id: data[0].customer_id || undefined } as AdvancedPayment : undefined,
      };
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : String(_error);
      logger.error('Error updating payment:', { error: msg });
      return { success: false, error: msg };
    }
  };

  // Delete payment
  const deletePayment = async (id: string): Promise<PaymentResponse> => {
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
      await fetchPayments();
      await fetchStats();
      toast({ title: 'Succès', description: 'Paiement supprimé avec succès' });
      return { success: true };
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : String(_error);
      logger.error('Error deleting payment:', { error: msg });
      return { success: false, error: msg };
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();

    const paymentsChannel = supabase
      .channel('advanced-payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: storeId ? `store_id=eq.${storeId}` : undefined }, () => { fetchPayments(); fetchStats(); })
      .subscribe();

    const transactionsChannel = supabase
      .channel('advanced-transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: storeId ? `store_id=eq.${storeId}` : undefined }, () => { fetchPayments(); fetchStats(); })
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [fetchPayments, fetchStats]);

  return {
    payments, loading, stats, error, totalCount,
    refetch: fetchPayments,
    createPayment, createPercentagePayment, createSecuredPayment,
    releasePayment, openDispute, updatePayment, deletePayment,
  };
};
