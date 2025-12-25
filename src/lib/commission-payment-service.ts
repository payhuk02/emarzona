/**
 * Service de paiement automatique des commissions
 * Gère les demandes de paiement, l'approbation et l'historique
 */
import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";
import {
  notifyPaymentRequestCreated,
  notifyPaymentRequestApproved,
  notifyPaymentRequestRejected,
  notifyPaymentRequestProcessed,
} from "./commission-notifications";

export interface CommissionPaymentRequest {
  commission_ids: string[]; // IDs des commissions à payer
  amount: number;
  currency?: string;
  payment_method: 'mobile_money' | 'bank_transfer' | 'paypal';
  payment_details: Record<string, unknown>;
  notes?: string;
}

export interface CommissionPayment {
  id: string;
  affiliate_id?: string;
  referrer_id?: string;
  commission_ids: string[];
  amount: number;
  currency: string;
  payment_method: string;
  payment_details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  approved_at?: string;
  approved_by?: string;
  processed_at?: string;
  transaction_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Créer une demande de paiement de commission
 */
export const createCommissionPaymentRequest = async (
  request: CommissionPaymentRequest,
  userId: string,
  type: 'affiliate' | 'referral'
): Promise<{ success: boolean; payment_id?: string; error?: string }> => {
  try {
    // Vérifier le montant minimum depuis platform_settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('min_withdrawal_amount, auto_approve_withdrawals')
      .single();

    const minAmount = settings?.min_withdrawal_amount || 10000;

    if (request.amount < minAmount) {
      return {
        success: false,
        error: `Le montant minimum pour un retrait est de ${minAmount.toLocaleString('fr-FR')} XOF`,
      };
    }

    // Vérifier que les commissions appartiennent à l'utilisateur
    let commissionIds: string[] = [];
    
    if (type === 'affiliate') {
      const { data: commissions, error: commError } = await supabase
        .from('affiliate_commissions')
        .select('id, commission_amount, status')
        .in('id', request.commission_ids)
        .eq('affiliate_id', userId)
        .eq('status', 'approved');

      if (commError || !commissions || commissions.length === 0) {
        return {
          success: false,
          error: 'Commissions non trouvées ou non approuvées',
        };
      }

      commissionIds = commissions.map(c => c.id);
    } else if (type === 'referral') {
      const { data: commissions, error: commError } = await supabase
        .from('referral_commissions')
        .select('id, commission_amount, status')
        .in('id', request.commission_ids)
        .eq('referrer_id', userId)
        .eq('status', 'completed');

      if (commError || !commissions || commissions.length === 0) {
        return {
          success: false,
          error: 'Commissions non trouvées ou non complétées',
        };
      }

      commissionIds = commissions.map(c => c.id);
    }

    // Calculer le montant total
    const totalAmount = request.commission_ids.reduce((sum, id) => {
      // Le montant est déjà calculé dans request.amount
      return sum;
    }, 0);

    if (Math.abs(totalAmount - request.amount) > 1) {
      return {
        success: false,
        error: 'Le montant ne correspond pas aux commissions sélectionnées',
      };
    }

    // Créer la demande de paiement
    const paymentData: Record<string, unknown> = {
      commission_ids: commissionIds,
      amount: request.amount,
      currency: request.currency || 'XOF',
      payment_method: request.payment_method,
      payment_details: request.payment_details,
      notes: request.notes,
      status: settings?.auto_approve_withdrawals ? 'approved' : 'pending',
    };

    if (type === 'affiliate') {
      paymentData.affiliate_id = userId;
    } else {
      paymentData.referrer_id = userId;
    }

    if (settings?.auto_approve_withdrawals) {
      paymentData.approved_at = new Date().toISOString();
      // Note: approved_by serait l'admin système, mais pour l'auto-approval on peut le laisser null
    }

    const { data: payment, error: paymentError } = await supabase
      .from(type === 'affiliate' ? 'affiliate_withdrawals' : 'commission_payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      logger.error('Error creating commission payment request', { error: paymentError });
      return {
        success: false,
        error: paymentError.message,
      };
    }

    // Marquer les commissions comme en attente de paiement
    if (type === 'affiliate') {
      await supabase
        .from('affiliate_commissions')
        .update({ status: 'paid' })
        .in('id', commissionIds);
    } else {
      // Pour les referrals, on peut créer une table commission_payments ou utiliser une colonne payment_id
      // Pour l'instant, on marque simplement comme paid
      await supabase
        .from('referral_commissions')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .in('id', commissionIds);
    }

    logger.log('Commission payment request created', {
      payment_id: payment.id,
      type,
      amount: request.amount,
    });

    // Notifier l'utilisateur
    await notifyPaymentRequestCreated(userId, {
      payment_id: payment.id,
      amount: request.amount,
      currency: request.currency || 'XOF',
    });

    return {
      success: true,
      payment_id: payment.id,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error in createCommissionPaymentRequest', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Approuver une demande de paiement (admin seulement)
 */
export const approveCommissionPayment = async (
  paymentId: string,
  adminId: string,
  type: 'affiliate' | 'referral'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(type === 'affiliate' ? 'affiliate_withdrawals' : 'commission_payments')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .eq('status', 'pending');

    if (error) {
      logger.error('Error approving commission payment', { error });
      return {
        success: false,
        error: error.message,
      };
    }

    // Récupérer les infos du paiement pour la notification
    if (type === 'affiliate') {
      const { data: paymentData } = await supabase
        .from('affiliate_withdrawals')
        .select('affiliate_id, amount, currency, affiliates(user_id)')
        .eq('id', paymentId)
        .single();

      const userId = (paymentData?.affiliates as { user_id?: string } | null)?.user_id;
      if (userId && paymentData) {
        await notifyPaymentRequestApproved(userId, {
          payment_id: paymentId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'XOF',
        });
      }
    } else {
      const { data: paymentData } = await supabase
        .from('commission_payments')
        .select('referrer_id, amount, currency')
        .eq('id', paymentId)
        .single();

      if (paymentData?.referrer_id) {
        await notifyPaymentRequestApproved(paymentData.referrer_id, {
          payment_id: paymentId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'XOF',
        });
      }
    }

    logger.log('Commission payment approved', { payment_id: paymentId, admin_id: adminId });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error in approveCommissionPayment', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Traiter un paiement de commission (marquer comme complété après virement)
 */
export const processCommissionPayment = async (
  paymentId: string,
  adminId: string,
  transactionReference: string,
  type: 'affiliate' | 'referral'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(type === 'affiliate' ? 'affiliate_withdrawals' : 'commission_payments')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        processed_by: adminId,
        transaction_reference: transactionReference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .in('status', ['approved', 'processing']);

    if (error) {
      logger.error('Error processing commission payment', { error });
      return {
        success: false,
        error: error.message,
      };
    }

    // Récupérer les infos du paiement pour la notification
    // (le trigger SQL le fait déjà, mais on peut aussi l'envoyer ici)
    if (type === 'affiliate') {
      const { data: paymentData } = await supabase
        .from('affiliate_withdrawals')
        .select('affiliate_id, amount, currency, affiliates(user_id)')
        .eq('id', paymentId)
        .single();

      const userId = (paymentData?.affiliates as { user_id?: string } | null)?.user_id;
      if (userId && paymentData) {
        await notifyPaymentRequestProcessed(userId, {
          payment_id: paymentId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'XOF',
          transaction_reference: transactionReference,
        });
      }
    } else {
      const { data: paymentData } = await supabase
        .from('commission_payments')
        .select('referrer_id, amount, currency')
        .eq('id', paymentId)
        .single();

      if (paymentData?.referrer_id) {
        await notifyPaymentRequestProcessed(paymentData.referrer_id, {
          payment_id: paymentId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'XOF',
          transaction_reference: transactionReference,
        });
      }
    }

    logger.log('Commission payment processed', {
      payment_id: paymentId,
      admin_id: adminId,
      transaction_reference: transactionReference,
    });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error in processCommissionPayment', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Récupérer l'historique des paiements de commissions
 */
export const getCommissionPaymentHistory = async (
  userId: string,
  type: 'affiliate' | 'referral',
  limit: number = 50
): Promise<{ success: boolean; payments?: CommissionPayment[]; error?: string }> => {
  try {
    const tableName = type === 'affiliate' ? 'affiliate_withdrawals' : 'commission_payments';
    const userIdColumn = type === 'affiliate' ? 'affiliate_id' : 'referrer_id';

    const { data: payments, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(userIdColumn, userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching commission payment history', { error });
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      payments: payments as CommissionPayment[],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error in getCommissionPaymentHistory', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
};

