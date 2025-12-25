/**
 * Service d'annulation de paiements Moneroo
 * Gère l'annulation des paiements en attente
 */

import { supabase } from "@/integrations/supabase/client";
import { monerooClient } from "./moneroo-client";
import { logger } from './logger';
import {
  parseMonerooError,
  MonerooValidationError,
} from "./moneroo-errors";

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
 * Annule un paiement Moneroo en attente
 */
export const cancelMonerooPayment = async (
  options: CancelPaymentOptions
): Promise<CancelPaymentResult> => {
  const { transactionId, reason } = options;

  try {
    // Validation
    if (!transactionId) {
      throw new MonerooValidationError("Transaction ID is required");
    }

    // Récupérer la transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new MonerooValidationError("Transaction not found");
    }

    // Vérifier que la transaction peut être annulée
    if (!["pending", "processing"].includes(transaction.status)) {
      throw new MonerooValidationError(
        `Cannot cancel transaction with status: ${transaction.status}. Only pending or processing transactions can be cancelled.`
      );
    }

    // Vérifier que c'est une transaction Moneroo
    if (transaction.payment_provider !== "moneroo" || !transaction.moneroo_transaction_id) {
      throw new MonerooValidationError("Transaction is not a Moneroo payment");
    }

    // Vérifier si le paiement peut être annulé (pas déjà complété ou échoué)
    if (["completed", "failed", "cancelled", "refunded"].includes(transaction.status)) {
      throw new MonerooValidationError(
        `Transaction cannot be cancelled. Current status: ${transaction.status}`
      );
    }

    // Log de début d'annulation
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "cancel_initiated",
      status: "processing",
      request_data: { reason: reason || "User request" },
    }]);

    // Appeler l'API Moneroo pour annuler le paiement
    try {
      await monerooClient.cancelPayment(transaction.moneroo_transaction_id);
    } catch (apiError) {
      // Si l'API Moneroo ne supporte pas l'annulation ou si le paiement est déjà traité,
      // on peut quand même marquer la transaction comme annulée localement
      logger.warn("Moneroo cancel API call failed, marking as cancelled locally:", apiError);
      
      // Vérifier à nouveau le statut auprès de Moneroo
      try {
        const paymentStatus = await monerooClient.verifyPayment(transaction.moneroo_transaction_id);
        
        // Si le paiement est déjà complété, on ne peut pas l'annuler
        if (paymentStatus.status === "completed" || paymentStatus.status === "success") {
          throw new MonerooValidationError(
            "Payment has already been completed and cannot be cancelled"
          );
        }
        
        // Si le paiement a échoué, on peut le marquer comme annulé
        if (paymentStatus.status === "failed") {
          logger.log("Payment already failed, marking as cancelled");
        }
      } catch (verifyError) {
        // Si la vérification échoue, on continue avec l'annulation locale
        logger.warn("Could not verify payment status, proceeding with local cancellation:", verifyError);
      }
    }

    // Mettre à jour la transaction comme annulée
    const cancelledAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "cancelled",
        metadata: {
          ...(transaction.metadata as Record<string, unknown> || {}),
          cancellation: {
            cancelled_at: cancelledAt,
            reason: reason || "User request",
            cancelled_by: "system", // Peut être amélioré pour inclure l'utilisateur
          },
        },
        updated_at: cancelledAt,
      })
      .eq("id", transactionId);

    if (updateError) {
      logger.error("Error updating transaction with cancellation:", updateError);
      throw new MonerooValidationError("Failed to update transaction status");
    }

    // Mettre à jour la commande associée si elle existe
    if (transaction.order_id) {
      await supabase
        .from("orders")
        .update({
          payment_status: "cancelled",
          status: "cancelled",
          updated_at: cancelledAt,
        })
        .eq("id", transaction.order_id)
        .catch((err) => {
          logger.warn("Error updating order status:", err);
        });
    }

    // Mettre à jour le paiement associé si il existe
    if (transaction.payment_id) {
      await supabase
        .from("payments")
        .update({
          status: "cancelled",
          updated_at: cancelledAt,
        })
        .eq("id", transaction.payment_id)
        .catch((err) => {
          logger.warn("Error updating payment status:", err);
        });
    }

    // Log d'annulation complétée
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "cancel_completed",
      status: "cancelled",
      request_data: { reason: reason || "User request" },
    }]);

    logger.log("Payment cancelled successfully:", {
      transactionId,
      cancelledAt,
    });

    // Envoyer une notification d'annulation
    const { notifyPaymentCancelled } = await import('./moneroo-notifications');
    await notifyPaymentCancelled({
      transactionId,
      userId: transaction.customer_id,
      customerEmail: transaction.customer_email || undefined,
      customerName: transaction.customer_name || undefined,
      amount: transaction.amount,
      currency: transaction.currency || 'XOF',
      status: 'cancelled',
      reason: reason || "User request",
      orderId: transaction.order_id || undefined,
    }).catch((err) => logger.warn('Error sending cancellation notification:', err));

    return {
      success: true,
      cancelled_at: cancelledAt,
    };
  } catch (error: unknown) {
    const monerooError = parseMonerooError(error);
    
    // Log de l'erreur
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "cancel_failed",
      status: "failed",
      error_data: {
        error: monerooError.message,
        code: monerooError.code,
      },
    }]).catch((err) => logger.error("Error logging cancellation failure", { error: err }));

    logger.error("Cancellation error:", {
      error: monerooError.message,
      code: monerooError.code,
      transactionId,
    });

    return {
      success: false,
      error: monerooError.message,
    };
  }
};

/**
 * Vérifie si un paiement peut être annulé
 */
export const canCancelPayment = async (transactionId: string): Promise<boolean> => {
  try {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("status, payment_provider, moneroo_transaction_id")
      .eq("id", transactionId)
      .single();

    if (error || !transaction) {
      return false;
    }

    // Vérifier que c'est une transaction Moneroo
    if (transaction.payment_provider !== "moneroo" || !transaction.moneroo_transaction_id) {
      return false;
    }

    // Vérifier le statut
    return ["pending", "processing"].includes(transaction.status);
  } catch (error) {
    logger.error("Error checking if payment can be cancelled:", error);
    return false;
  }
};

