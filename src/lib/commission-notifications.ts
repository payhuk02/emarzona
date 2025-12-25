/**
 * Service de notifications pour les commissions
 * Envoie des notifications pour les événements liés aux commissions (création, approbation, paiement, etc.)
 */
import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

export type CommissionNotificationType =
  | 'commission_created'
  | 'commission_approved'
  | 'commission_rejected'
  | 'commission_paid'
  | 'commission_threshold_reached'
  | 'payment_request_created'
  | 'payment_request_approved'
  | 'payment_request_rejected'
  | 'payment_request_processed'
  | 'weekly_report'
  | 'monthly_report';

export interface CommissionNotification {
  id?: string;
  user_id: string;
  notification_type: CommissionNotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at?: string;
}

export interface CommissionNotificationData {
  commission_id?: string;
  affiliate_id?: string;
  referrer_id?: string;
  amount?: number;
  currency?: string;
  order_id?: string;
  order_number?: string;
  product_name?: string;
  threshold_amount?: number;
  payment_id?: string;
  transaction_reference?: string;
}

/**
 * Créer une notification de commission
 */
const createNotification = async (
  userId: string,
  type: CommissionNotificationType,
  title: string,
  message: string,
  data?: CommissionNotificationData
): Promise<{ success: boolean; notification_id?: string; error?: string }> => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title,
        message,
        metadata: data || {},
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating commission notification', { error, userId, type });
      return { success: false, error: error.message };
    }

    logger.log('Commission notification created', {
      notification_id: notification.id,
      user_id: userId,
      type,
    });

    return { success: true, notification_id: notification.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error in createNotification', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

/**
 * Notification: Commission créée
 */
export const notifyCommissionCreated = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '🎉 Nouvelle commission !';
  const message = data.order_number
    ? `Une commission de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été créée pour la commande ${data.order_number}`
    : `Une commission de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été créée`;

  return createNotification(userId, 'commission_created', title, message, data);
};

/**
 * Notification: Commission approuvée
 */
export const notifyCommissionApproved = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '✅ Commission approuvée';
  const message = `Votre commission de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été approuvée et sera bientôt payée`;

  return createNotification(userId, 'commission_approved', title, message, data);
};

/**
 * Notification: Commission rejetée
 */
export const notifyCommissionRejected = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '❌ Commission rejetée';
  const message = `Votre commission de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été rejetée. Contactez le support pour plus d'informations`;

  return createNotification(userId, 'commission_rejected', title, message, data);
};

/**
 * Notification: Commission payée
 */
export const notifyCommissionPaid = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '💰 Commission payée !';
  const message = data.transaction_reference
    ? `Votre commission de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été payée. Référence: ${data.transaction_reference}`
    : `Votre commission de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été payée`;

  return createNotification(userId, 'commission_paid', title, message, data);
};

/**
 * Notification: Seuil de commission atteint
 */
export const notifyCommissionThresholdReached = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '🎯 Seuil de commission atteint !';
  const message = `Félicitations ! Vous avez atteint le seuil de ${data.threshold_amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} en commissions. Vous pouvez maintenant demander un paiement`;

  return createNotification(userId, 'commission_threshold_reached', title, message, data);
};

/**
 * Notification: Demande de paiement créée
 */
export const notifyPaymentRequestCreated = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '📝 Demande de paiement créée';
  const message = `Votre demande de paiement de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été créée et est en attente d'approbation`;

  return createNotification(userId, 'payment_request_created', title, message, data);
};

/**
 * Notification: Demande de paiement approuvée
 */
export const notifyPaymentRequestApproved = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '✅ Demande de paiement approuvée';
  const message = `Votre demande de paiement de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été approuvée et sera traitée prochainement`;

  return createNotification(userId, 'payment_request_approved', title, message, data);
};

/**
 * Notification: Demande de paiement rejetée
 */
export const notifyPaymentRequestRejected = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '❌ Demande de paiement rejetée';
  const message = `Votre demande de paiement de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été rejetée. Contactez le support pour plus d'informations`;

  return createNotification(userId, 'payment_request_rejected', title, message, data);
};

/**
 * Notification: Demande de paiement traitée
 */
export const notifyPaymentRequestProcessed = async (
  userId: string,
  data: CommissionNotificationData
): Promise<{ success: boolean; error?: string }> => {
  const title = '💰 Paiement traité !';
  const message = data.transaction_reference
    ? `Votre paiement de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été traité. Référence: ${data.transaction_reference}`
    : `Votre paiement de ${data.amount?.toLocaleString('fr-FR')} ${data.currency || 'XOF'} a été traité`;

  return createNotification(userId, 'payment_request_processed', title, message, data);
};

/**
 * Notification: Rapport hebdomadaire
 */
export const notifyWeeklyReport = async (
  userId: string,
  data: {
    total_commissions: number;
    total_sales: number;
    total_clicks: number;
    currency?: string;
    week_start: string;
    week_end: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  const title = '📊 Rapport hebdomadaire';
  const message = `Votre rapport de la semaine (${data.week_start} - ${data.week_end}): ${data.total_sales} ventes, ${data.total_clicks} clics, ${data.total_commissions.toLocaleString('fr-FR')} ${data.currency || 'XOF'} en commissions`;

  return createNotification(userId, 'weekly_report', title, message, data);
};

/**
 * Notification: Rapport mensuel
 */
export const notifyMonthlyReport = async (
  userId: string,
  data: {
    total_commissions: number;
    total_sales: number;
    total_clicks: number;
    currency?: string;
    month: string;
    year: number;
  }
): Promise<{ success: boolean; error?: string }> => {
  const title = '📊 Rapport mensuel';
  const message = `Votre rapport du mois de ${data.month} ${data.year}: ${data.total_sales} ventes, ${data.total_clicks} clics, ${data.total_commissions.toLocaleString('fr-FR')} ${data.currency || 'XOF'} en commissions`;

  return createNotification(userId, 'monthly_report', title, message, data);
};

/**
 * Envoyer des notifications en batch (pour les rapports)
 */
export const sendBulkNotifications = async (
  userIds: string[],
  type: CommissionNotificationType,
  title: string,
  message: string,
  data?: CommissionNotificationData
): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> => {
  const results = await Promise.allSettled(
    userIds.map(userId => createNotification(userId, type, title, message, data))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
  const errors = results
    .filter(r => r.status === 'fulfilled' && !r.value.success)
    .map(r => (r as PromiseFulfilledResult<{ success: boolean; error?: string }>).value.error)
    .filter((error): error is string => !!error);

  logger.log('Bulk notifications sent', {
    total: userIds.length,
    successful,
    failed,
    type,
  });

  return {
    success: failed === 0,
    sent: successful,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
};

