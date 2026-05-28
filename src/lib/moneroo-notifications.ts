/**
 * Service de notifications pour les paiements Moneroo
 * Envoie des notifications email, SMS et in-app pour les événements de paiement
 *
 * MIGRÉ vers le système unifié pour garantir la cohérence et les notifications sonores
 */

import { supabase } from '@/integrations/supabase/client';
import { sendUnifiedNotification } from './notifications/unified-notifications';
import { logger } from './logger';
import { maskEmail, maskPhone } from './moneroo-log-sanitize';

export interface PaymentNotificationData {
  transactionId: string;
  userId?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  storeId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  orderId?: string;
  orderNumber?: string;
  reason?: string;
}

/**
 * Envoie une notification de paiement réussi
 */
export const notifyPaymentSuccess = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // ✅ Utiliser le système unifié pour garantir la cohérence et les notifications sonores
    if (data.userId) {
      await sendUnifiedNotification({
        user_id: data.userId,
        type: 'order_payment_received',
        title: '✅ Paiement réussi !',
        message: `Votre paiement de ${data.amount.toLocaleString()} ${data.currency} a été confirmé avec succès.${data.orderNumber ? ` Commande #${data.orderNumber}` : ''}`,
        priority: 'high',
        channels: ['in_app', 'email', 'push'], // Multi-canaux automatiques avec son
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          payment_method: data.paymentMethod,
          order_number: data.orderNumber,
        },
        action_url: data.orderId ? `/orders/${data.orderId}` : '/orders',
        action_label: 'Voir la commande',
        order_id: data.orderId,
      }).catch(err => {
        logger.warn('Error sending unified payment success notification:', err);
      });
    }

    // Déclencher webhook payment.completed (asynchrone)
    if (data.orderId && data.storeId) {
      import('@/lib/webhooks/webhook-system').then(({ triggerWebhook }) => {
        triggerWebhook(data.storeId, 'payment.completed', {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          order_number: data.orderNumber,
          amount: data.amount,
          currency: data.currency,
          payment_method: data.paymentMethod,
          customer_id: data.userId,
        }).catch(err => {
          logger.error('Error triggering payment webhook', {
            error: err,
            transactionId: data.transactionId,
          });
        });
      });
    }

    logger.log('Payment success notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
      email: data.customerEmail,
    });
  } catch (error) {
    logger.error('Error sending payment success notification:', error);
    // Ne pas faire échouer l'opération principale si la notification échoue
  }
};

/**
 * Envoie une notification de paiement échoué
 */
export const notifyPaymentFailed = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // ✅ Utiliser le système unifié pour garantir la cohérence et les notifications sonores
    if (data.userId) {
      await sendUnifiedNotification({
        user_id: data.userId,
        type: 'order_payment_failed',
        title: '❌ Paiement échoué',
        message: `Votre paiement de ${data.amount.toLocaleString()} ${data.currency} a échoué.${data.reason ? ` Raison : ${data.reason}` : ' Veuillez réessayer.'}`,
        priority: 'high',
        channels: ['in_app', 'email', 'push'], // Multi-canaux automatiques avec son
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          reason: data.reason,
        },
        action_url: data.orderId ? `/orders/${data.orderId}` : '/orders',
        action_label: 'Réessayer le paiement',
        order_id: data.orderId,
      }).catch(err => {
        logger.warn('Error sending unified payment failed notification:', err);
      });
    }

    logger.log('Payment failed notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
      email: data.customerEmail,
    });
  } catch (error) {
    logger.error('Error sending payment failed notification:', error);
  }
};

/**
 * Envoie une notification de paiement annulé
 */
export const notifyPaymentCancelled = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // ✅ Utiliser le système unifié pour garantir la cohérence et les notifications sonores
    if (data.userId) {
      await sendUnifiedNotification({
        user_id: data.userId,
        type: 'order_payment_failed', // Utiliser le type existant
        title: '🚫 Paiement annulé',
        message: `Votre paiement de ${data.amount.toLocaleString()} ${data.currency} a été annulé.${data.reason ? ` Raison : ${data.reason}` : ''}`,
        priority: 'normal',
        channels: ['in_app', 'email', 'push'], // Multi-canaux automatiques avec son
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          reason: data.reason,
          cancelled: true,
        },
        action_url: data.orderId ? `/orders/${data.orderId}` : '/orders',
        action_label: 'Voir la commande',
        order_id: data.orderId,
      }).catch(err => {
        logger.warn('Error sending unified payment cancelled notification:', err);
      });
    }

    logger.log('Payment cancelled notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
      email: data.customerEmail,
    });
  } catch (error) {
    logger.error('Error sending payment cancelled notification:', error);
  }
};

/**
 * Envoie une notification de remboursement
 */
export const notifyPaymentRefunded = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // ✅ Utiliser le système unifié pour garantir la cohérence et les notifications sonores
    if (data.userId) {
      await sendUnifiedNotification({
        user_id: data.userId,
        type: 'order_refund_processed',
        title: '💸 Remboursement effectué',
        message: `Un remboursement de ${data.amount.toLocaleString()} ${data.currency} a été effectué.${data.reason ? ` Raison : ${data.reason}` : ''}`,
        priority: 'high',
        channels: ['in_app', 'email', 'push'], // Multi-canaux automatiques avec son
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          reason: data.reason,
        },
        action_url: data.orderId ? `/orders/${data.orderId}` : '/orders',
        action_label: 'Voir la commande',
        order_id: data.orderId,
      }).catch(err => {
        logger.warn('Error sending unified payment refunded notification:', err);
      });
    }

    logger.log('Payment refunded notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
      email: data.customerEmail,
    });
  } catch (error) {
    logger.error('Error sending payment refunded notification:', error);
  }
};

/**
 * Envoie une notification de paiement en attente
 */
export const notifyPaymentPending = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // ✅ Utiliser le système unifié pour garantir la cohérence et les notifications sonores
    if (data.userId) {
      await sendUnifiedNotification({
        user_id: data.userId,
        type: 'order_payment_received', // Utiliser le type existant
        title: '⏳ Paiement en attente',
        message: `Votre paiement de ${data.amount.toLocaleString()} ${data.currency} est en cours de traitement.`,
        priority: 'normal',
        channels: ['in_app', 'email'], // Pas de push pour les notifications en attente
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          status: 'pending',
        },
        action_url: data.orderId ? `/orders/${data.orderId}` : '/orders',
        action_label: 'Voir la commande',
        order_id: data.orderId,
      }).catch(err => {
        logger.warn('Error sending unified payment pending notification:', err);
      });
    }

    logger.log('Payment pending notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
    });
  } catch (error) {
    logger.error('Error sending payment pending notification:', error);
  }
};

/**
 * Helper pour envoyer des emails de paiement
 * Utilise Supabase Edge Function (send-email) avec Resend API
 */
async function _sendPaymentEmail(params: {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: params.to,
        subject: params.subject,
        template: params.template,
        data: params.data,
      },
    });

    if (error) {
      logger.error('Error invoking send-email function:', error);
      throw error;
    }

    logger.log('Email sent successfully:', {
      toMasked: maskEmail(params.to),
      template: params.template,
      messageId: data?.messageId,
    });
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : String(_error);
    logger.error('Error sending payment email:', {
      error: errorMessage,
      toMasked: maskEmail(params.to),
      template: params.template,
    });
    // Ne pas faire échouer l'opération principale si l'email échoue
  }
}

/**
 * Helper pour envoyer des SMS (optionnel)
 * Utilise Supabase Edge Function (send-sms) avec Twilio API
 */
export async function sendPaymentSMS(params: {
  to: string;
  template: string;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: params.to,
        template: params.template,
        data: params.data,
      },
    });

    if (error) {
      logger.error('Error invoking send-sms function:', error);
      throw error;
    }

    logger.log('SMS sent successfully:', {
      toMasked: maskPhone(params.to),
      template: params.template,
      messageId: data?.messageId,
    });
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : String(_error);
    logger.error('Error sending payment SMS:', {
      error: errorMessage,
      toMasked: maskPhone(params.to),
      template: params.template,
    });
    // Ne pas faire échouer l'opération principale si le SMS échoue
  }
}

/**
 * Envoie une notification SMS pour un paiement réussi
 */
export const sendPaymentSuccessSMS = async (data: PaymentNotificationData): Promise<void> => {
  if (!data.customerPhone) {
    return;
  }

  await sendPaymentSMS({
    to: data.customerPhone,
    template: 'payment_success',
    data: {
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      orderNumber: data.orderNumber,
      transactionId: data.transactionId,
    },
  });
};

/**
 * Envoie une notification SMS pour un paiement échoué
 */
export const sendPaymentFailedSMS = async (data: PaymentNotificationData): Promise<void> => {
  if (!data.customerPhone) {
    return;
  }

  await sendPaymentSMS({
    to: data.customerPhone,
    template: 'payment_failed',
    data: {
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason,
      transactionId: data.transactionId,
    },
  });
};

/**
 * Envoie une notification SMS pour un paiement annulé
 */
export const sendPaymentCancelledSMS = async (data: PaymentNotificationData): Promise<void> => {
  if (!data.customerPhone) {
    return;
  }

  await sendPaymentSMS({
    to: data.customerPhone,
    template: 'payment_cancelled',
    data: {
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason,
      transactionId: data.transactionId,
    },
  });
};

/**
 * Envoie une notification SMS pour un remboursement
 */
export const sendPaymentRefundedSMS = async (data: PaymentNotificationData): Promise<void> => {
  if (!data.customerPhone) {
    return;
  }

  await sendPaymentSMS({
    to: data.customerPhone,
    template: 'payment_refunded',
    data: {
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason,
      transactionId: data.transactionId,
    },
  });
};
