/**
 * Service d'annulation de paiements GeniusPay
 * Gère l'annulation des paiements en attente
 */

import { supabase } from '@/integrations/supabase/client';
import { geniuspayClient } from './geniuspay-client';
import { logger } from './logger';
import { parseGeniusPayError, GeniusPayValidationError } from './geniuspay-errors';

export interface CancelPaymentOptions {
  transactionId: string;
  reason?: string;
}

export interface CancelPaymentResult {
  success: boolean;
  cancelled_at?: string;
  error?: string;
}

/**
 * Annule un paiement GeniusPay en attente
 */
export const cancelGeniusPayPayment = async (
  options: CancelPaymentOptions
): Promise<CancelPaymentResult> => {
  const { transactionId, reason } = options;

  try {
    // Validation
    if (!transactionId) {
      throw new GeniusPayValidationError('Transaction ID is required');
    }

    // Récupérer la transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select(
        'id,status,order_id,store_id,payment_id,customer_id,customer_email,customer_name,amount,currency,payment_provider,geniuspay_transaction_id,metadata,updated_at'
      )
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new GeniusPayValidationError('Transaction not found');
    }

    // Vérifier que la transaction peut être annulée
    if (!['pending', 'processing'].includes(transaction.status ?? '')) {
      throw new GeniusPayValidationError(
        `Cannot cancel transaction with status: ${transaction.status}. Only pending or processing transactions can be cancelled.`
      );
    }

    // Vérifier que c'est une transaction GeniusPay
    if (transaction.payment_provider !== 'geniuspay' || !transaction.geniuspay_transaction_id) {
      throw new GeniusPayValidationError('Transaction is not a GeniusPay payment');
    }

    // Vérifier si le paiement peut être annulé (pas déjà complété ou échoué)
    if (['completed', 'failed', 'cancelled', 'refunded'].includes(transaction.status ?? '')) {
      throw new GeniusPayValidationError(
        `Transaction cannot be cancelled. Current status: ${transaction.status}`
      );
    }

    // Log de début d'annulation
    await supabase.from('transaction_logs').insert([
      {
        transaction_id: transactionId,
        event_type: 'cancel_initiated',
        status: 'processing',
        request_data: { reason: reason || 'User request' },
      },
    ]);

    // Appeler l'API GeniusPay pour annuler le paiement
    try {
      await geniuspayClient.cancelPayment(transaction.geniuspay_transaction_id);
    } catch (apiError) {
      // Si l'API GeniusPay ne supporte pas l'annulation ou si le paiement est déjà traité,
      // on peut quand même marquer la transaction comme annulée localement
      logger.warn('GeniusPay cancel API call failed, marking as cancelled locally:', apiError);

      // Vérifier à nouveau le statut auprès de GeniusPay
      try {
        const paymentStatus = await geniuspayClient.verifyPayment(transaction.geniuspay_transaction_id);

        // Si le paiement est déjà complété, on ne peut pas l'annuler
        if (paymentStatus.status === 'completed' || paymentStatus.status === 'success') {
          throw new GeniusPayValidationError(
            'Payment has already been completed and cannot be cancelled'
          );
        }

        // Si le paiement a échoué, on peut le marquer comme annulé
        if (paymentStatus.status === 'failed') {
          logger.log('Payment already failed, marking as cancelled');
        }
      } catch (verifyError) {
        // Si la vérification échoue, on continue avec l'annulation locale
        logger.warn(
          'Could not verify payment status, proceeding with local cancellation:',
          verifyError
        );
      }
    }

    // Mettre à jour la transaction comme annulée
    const cancelledAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        metadata: {
          ...((transaction.metadata as Record<string, unknown>) || {}),
          cancellation: {
            cancelled_at: cancelledAt,
            reason: reason || 'User request',
            cancelled_by: 'system', // Peut être amélioré pour inclure l'utilisateur
          },
        },
        updated_at: cancelledAt,
      })
      .eq('id', transactionId);

    if (updateError) {
      logger.error('Error updating transaction with cancellation:', updateError);
      throw new GeniusPayValidationError('Failed to update transaction status');
    }

    // Mettre à jour la commande associée si elle existe
    if (transaction.order_id) {
      const { error: orderCancelErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'cancelled',
          status: 'cancelled',
          updated_at: cancelledAt,
        })
        .eq('id', transaction.order_id);
      if (orderCancelErr) {
        logger.warn('Error updating order status:', orderCancelErr);
      }
    }

    // Mettre à jour le paiement associé si il existe
    if (transaction.payment_id) {
      const { error: paymentCancelErr } = await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          updated_at: cancelledAt,
        })
        .eq('id', transaction.payment_id);
      if (paymentCancelErr) {
        logger.warn('Error updating payment status:', paymentCancelErr);
      }
    }

    // Log d'annulation complétée
    await supabase.from('transaction_logs').insert([
      {
        transaction_id: transactionId,
        event_type: 'cancel_completed',
        status: 'cancelled',
        request_data: { reason: reason || 'User request' },
      },
    ]);

    logger.log('Payment cancelled successfully:', {
      transactionId,
      cancelledAt,
    });

    // Envoyer une notification d'annulation
    const { notifyPaymentCancelled } = await import('./geniuspay-notifications');
    await notifyPaymentCancelled({
      transactionId,
      userId: transaction.customer_id,
      customerEmail: transaction.customer_email || undefined,
      customerName: transaction.customer_name || undefined,
      amount: transaction.amount,
      currency: transaction.currency || 'XOF',
      status: 'cancelled',
      reason: reason || 'User request',
      orderId: transaction.order_id || undefined,
    }).catch(err => logger.warn('Error sending cancellation notification:', err));

    return {
      success: true,
      cancelled_at: cancelledAt,
    };
  } catch (_error: unknown) {
    const geniuspayError = parseGeniusPayError(_error);

    // Log de l'erreur
    const { error: cancelLogErr } = await supabase.from('transaction_logs').insert([
      {
        transaction_id: transactionId,
        event_type: 'cancel_failed',
        status: 'failed',
        error_data: {
          error: geniuspayError.message,
          code: geniuspayError.code,
        },
      },
    ]);
    if (cancelLogErr) {
      logger.error('Error logging cancellation failure', { error: cancelLogErr });
    }

    logger.error('Cancellation error:', {
      error: geniuspayError.message,
      code: geniuspayError.code,
      transactionId,
    });

    return {
      success: false,
      error: geniuspayError.message,
    };
  }
};

/**
 * Vérifie si un paiement peut être annulé
 */
export const canCancelPayment = async (transactionId: string): Promise<boolean> => {
  try {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('status, payment_provider, geniuspay_transaction_id')
      .eq('id', transactionId)
      .single();

    if (error || !transaction) {
      return false;
    }

    // Vérifier que c'est une transaction GeniusPay
    if (transaction.payment_provider !== 'geniuspay' || !transaction.geniuspay_transaction_id) {
      return false;
    }

    // Vérifier le statut
    return ['pending', 'processing'].includes(transaction.status ?? '');
  } catch (error) {
    logger.error('Error checking if payment can be cancelled:', { error });
    return false;
  }
};
