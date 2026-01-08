import { supabase } from "@/integrations/supabase/client";
import { monerooClient, MonerooCheckoutData } from "./moneroo-client";
import { logger } from './logger';
import {
  parseMonerooError,
  MonerooError,
  MonerooValidationError,
  MonerooNetworkError,
  MonerooAPIError,
} from "./moneroo-errors";
import { Currency, isSupportedCurrency } from "./currency-converter";
import { MonerooCheckoutResponse } from "./moneroo-types";
import { validateAmount } from "./moneroo-amount-validator";

export interface PaymentOptions {
  storeId: string;
  productId?: string;
  orderId?: string;
  customerId?: string;
  amount: number;
  currency?: Currency;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundOptions {
  transactionId: string;
  amount?: number; // Si non spécifié, remboursement total
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refund_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
}

// Export cancellation functions
export { cancelMonerooPayment, canCancelPayment } from './moneroo-cancellation';
export type { CancelPaymentOptions, CancelPaymentResult } from './moneroo-cancellation';

/**
 * Initie un paiement Moneroo complet avec tracking dans la base de données
 */
export const initiateMonerooPayment = async (options: PaymentOptions) => {
  const {
    storeId,
    productId,
    orderId,
    customerId,
    amount,
    currency: requestedCurrency = "XOF",
    description,
    customerEmail,
    customerName,
    customerPhone,
    metadata = {},
  } = options;

  // Valider la devise
  const  currency: Currency = isSupportedCurrency(requestedCurrency) 
    ? requestedCurrency 
    : "XOF";

  // Valider le montant selon les limites Moneroo
  validateAmount(amount, currency);

  // Validation des paramètres obligatoires
  if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
    logger.error("Invalid storeId in initiateMonerooPayment:", { storeId, options });
    throw new MonerooValidationError(`storeId invalide: ${storeId}. Doit être un UUID valide.`);
  }

  if (productId && (typeof productId !== 'string' || productId.trim() === '')) {
    logger.error("Invalid productId in initiateMonerooPayment:", { productId, options });
    throw new MonerooValidationError(`productId invalide: ${productId}. Doit être un UUID valide.`);
  }

  if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    logger.error("Invalid customerEmail in initiateMonerooPayment:", { customerEmail, options });
    throw new MonerooValidationError(`customerEmail invalide: ${customerEmail}. Doit être une adresse email valide.`);
  }

  logger.log("initiateMonerooPayment - Paramètres validés:", {
    storeId,
    productId,
    amount,
    currency,
    customerEmail,
    hasDescription: !!description,
    hasMetadata: Object.keys(metadata).length > 0,
  });

  try {
    // Récupérer l'utilisateur actuel pour l'ajouter dans metadata
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = customerId || user?.id;

    // 1. Créer la transaction dans la base de données
    const  transactionData: Record<string, unknown> = {
      store_id: storeId,
      product_id: productId,
      order_id: orderId,
      amount,
      currency,
      status: "pending",
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      metadata: {
        ...metadata,
        // Ajouter userId dans metadata pour faciliter l'identification RLS
        userId: currentUserId,
      },
      payment_provider: "moneroo", // Indiquer que c'est Moneroo
    };

    // Ajouter customer_id seulement s'il est fourni (peut ne pas exister dans la table)
    if (customerId) {
      transactionData.customer_id = customerId;
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) {
      logger.error("Error creating transaction:", {
        error: transactionError,
        code: transactionError.code,
        message: transactionError.message,
        details: transactionError.details,
        hint: transactionError.hint,
        storeId,
        customerId: currentUserId,
        productId,
        amount,
        currency,
        transactionData,
      });
      
      // Afficher un message d'erreur plus détaillé
      const errorMessage = transactionError.message || "Erreur inconnue";
      const errorHint = transactionError.hint || "";
      const errorDetails = transactionError.details || "";
      
      // Vérifier si l'erreur concerne une colonne manquante
      const isColumnMissingError = errorMessage.includes("column") && 
                                   (errorMessage.includes("does not exist") || 
                                    errorMessage.includes("schema cache"));
      
      // Vérifier si l'erreur concerne des permissions RLS
      const isPermissionError = errorMessage.includes("permission denied") || 
                                errorMessage.includes("permission denied for table");
      
      let  userFriendlyMessage= `Impossible de créer la transaction: ${errorMessage}`;
      
      if (isColumnMissingError) {
        userFriendlyMessage += "\n\n💡 SOLUTION COMPLÈTE:\n";
        userFriendlyMessage += "1. Ouvrez Supabase Dashboard → SQL Editor\n";
        userFriendlyMessage += "2. Exécutez le script: FIX_ALL_TRANSACTIONS_COLUMNS.sql\n";
        userFriendlyMessage += "   (Ce script ajoute TOUTES les colonnes manquantes)\n\n";
        userFriendlyMessage += "OU exécutez cette requête SQL directement:\n\n";
        userFriendlyMessage += "ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS order_id UUID;\n";
        userFriendlyMessage += "ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS store_id UUID;\n";
        userFriendlyMessage += "ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS product_id UUID;\n";
        userFriendlyMessage += "ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';\n\n";
        userFriendlyMessage += "3. Rafraîchissez le cache: Settings → API → Refresh schema cache\n";
        userFriendlyMessage += "4. Videz le cache du navigateur (Ctrl+Shift+R)\n\n";
        userFriendlyMessage += "📁 Fichier complet: FIX_ALL_TRANSACTIONS_COLUMNS.sql dans le projet";
      } else if (isPermissionError) {
        userFriendlyMessage += "\n\n💡 SOLUTION PERMISSIONS RLS:\n";
        userFriendlyMessage += "1. Ouvrez Supabase Dashboard → SQL Editor\n";
        userFriendlyMessage += "2. Exécutez le script: FIX_RLS_PERMISSIONS.sql\n";
        userFriendlyMessage += "   (Ce script corrige les permissions RLS)\n\n";
        userFriendlyMessage += "3. Rafraîchissez le cache: Settings → API → Refresh schema cache\n";
        userFriendlyMessage += "4. Videz le cache du navigateur (Ctrl+Shift+R)\n\n";
        userFriendlyMessage += "📁 Fichier complet: FIX_RLS_PERMISSIONS.sql dans le projet";
      }
      
      if (errorHint) {
        userFriendlyMessage += `\n\n💡 Indice: ${errorHint}`;
      }
      
      if (errorDetails) {
        userFriendlyMessage += `\n\n📋 Détails: ${errorDetails}`;
      }
      
      logger.error("Transaction error details", {
        error: transactionError,
        code: transactionError.code,
        message: transactionError.message,
        storeId,
        customerId: currentUserId,
        productId,
        transactionData,
        isColumnMissingError,
      });
      
      // Utiliser MonerooValidationError au lieu de Error générique
      throw new MonerooValidationError(userFriendlyMessage, {
        transactionError,
        storeId,
        customerId: currentUserId,
        productId,
      });
    }

    logger.log("Transaction created:", transaction.id);

    // 2. Log de création de transaction (non-bloquant)
    try {
      await supabase.from("transaction_logs").insert([{
        transaction_id: transaction.id,
        event_type: "created",
        status: "pending",
        request_data: JSON.parse(JSON.stringify(options)),
      }]);
    } catch ( _logError: unknown) {
      // Ne pas bloquer le processus si le log échoue
      logger.warn("Failed to insert transaction log (non-critical):", logError);
    }

    // 3. Initialiser le paiement Moneroo
    // IMPORTANT: productId doit être passé directement dans data, pas seulement dans metadata
    // L'Edge Function l'extraira et l'ajoutera à metadata.product_id
    
    // Nettoyer metadata : supprimer les valeurs null, undefined, et vides
    // L'API Moneroo n'accepte que string, boolean ou integer dans metadata
    const  cleanMetadata: Record<string, unknown> = {
      transaction_id: transaction.id,
      store_id: storeId,
      ...(productId && { product_id: productId }), // Ajouter product_id dans metadata aussi
    };
    
    // Ajouter les métadonnées personnalisées en filtrant les valeurs null/undefined
    Object.entries(metadata || {}).forEach(([key, value]) => {
      // Ne pas inclure null, undefined, ou chaînes vides
      if (value !== null && value !== undefined && value !== '') {
        // Si c'est null, ne pas l'inclure
        if (typeof value === 'object' && value !== null) {
          // Pour les objets, vérifier qu'ils ne sont pas vides
          if (Object.keys(value).length > 0) {
            cleanMetadata[key] = value;
          }
        } else {
          cleanMetadata[key] = value;
        }
      }
    });
    
    const  checkoutData: MonerooCheckoutData = {
      amount,
      currency,
      description,
      customer_email: customerEmail,
      customer_name: customerName,
      return_url: `${window.location.origin}/checkout/success?transaction_id=${transaction.id}`,
      cancel_url: `${window.location.origin}/checkout/cancel?transaction_id=${transaction.id}`,
      metadata: cleanMetadata,
    };
    
    // Ajouter productId et storeId directement dans data pour que l'Edge Function puisse les extraire
    // L'Edge Function vérifie data.productId et l'ajoute à metadata.product_id
    const checkoutDataWithIds = {
      ...checkoutData,
      productId: productId, // Passer productId directement dans data
      storeId: storeId,     // Passer storeId directement dans data
    };

    logger.log("Initiating Moneroo checkout:", {
      ...checkoutDataWithIds,
      amount: typeof checkoutDataWithIds.amount === 'number' ? checkoutDataWithIds.amount : Number(checkoutDataWithIds.amount),
      currency: checkoutDataWithIds.currency,
      hasReturnUrl: !!checkoutDataWithIds.return_url,
      hasCancelUrl: !!checkoutDataWithIds.cancel_url,
      metadataKeys: Object.keys(checkoutDataWithIds.metadata || {}),
      hasProductId: !!checkoutDataWithIds.productId,
      hasStoreId: !!checkoutDataWithIds.storeId,
    });

    let monerooResponse;
    try {
      logger.log("Calling monerooClient.createCheckout...");
      // Passer checkoutDataWithIds qui contient productId et storeId directement
      monerooResponse = await monerooClient.createCheckout(checkoutDataWithIds);
      logger.log("Moneroo response received successfully:", {
        hasResponse: !!monerooResponse,
        responseType: typeof monerooResponse,
        responseKeys: monerooResponse ? Object.keys(monerooResponse) : [],
        fullResponse: monerooResponse,
      });
    } catch (_checkoutError: unknown) {
      const error = _checkoutError instanceof Error ? _checkoutError : new Error(String(_checkoutError));
      logger.error("Error in monerooClient.createCheckout:", {
        error: _checkoutError,
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack,
        checkoutData,
      });
      // Relancer l'erreur pour qu'elle soit gérée par le catch principal
      throw _checkoutError;
    }

    // 4. Extraire les données de la réponse Moneroo
    // Selon la documentation Moneroo : https://docs.moneroo.io/
    // La réponse Moneroo est : { message: "...", data: { id: "...", checkout_url: "..." } }
    // L'Edge Function  _retourne: { success: true, data: { message: "...", data: { id: "...", checkout_url: "..." } } }
    // Dans moneroo-client.ts, on retourne response.data, donc monerooResponse est : { message: "...", data: { id: "...", checkout_url: "..." } }
    // Il faut donc accéder à monerooResponse.data.checkout_url et monerooResponse.data.id
    const typedResponse = monerooResponse as MonerooCheckoutResponse;
    const monerooData = typedResponse.data;
    
    if (!monerooData) {
      logger.error("Moneroo response missing data:", monerooResponse);
      throw new MonerooAPIError(
        "La réponse Moneroo ne contient pas de données. Vérifiez les logs Supabase pour plus de détails.",
        500,
        monerooResponse
      );
    }
    
    const checkoutUrl = monerooData.checkout_url;
    const transactionId = monerooData.id || monerooData.transaction_id;

    if (!checkoutUrl) {
      logger.error("Moneroo response missing checkout_url:", monerooResponse);
      throw new MonerooAPIError(
        "La réponse Moneroo ne contient pas d'URL de checkout. Vérifiez les logs Supabase pour plus de détails.",
        500,
        monerooResponse
      );
    }

    // 5. Mettre à jour la transaction avec les infos Moneroo
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        moneroo_transaction_id: transactionId,
        moneroo_checkout_url: checkoutUrl,
        moneroo_response: monerooResponse,
        status: "processing",
      })
      .eq("id", transaction.id);

    if (updateError) {
      logger.error("Error updating transaction:", updateError);
    }

    // 6. Log du paiement initié (non-bloquant)
    try {
      await supabase.from("transaction_logs").insert([{
        transaction_id: transaction.id,
        event_type: "payment_initiated",
        status: "processing",
        response_data: monerooResponse,
      }]);
    } catch (_logError: unknown) {
      // Ne pas bloquer le processus si le log échoue
      logger.warn("Failed to insert payment initiated log (non-critical):", _logError);
    }

    // 7. Retourner les données pour redirection
    return {
      success: true,
      transaction_id: transaction.id,
      checkout_url: checkoutUrl,
      moneroo_transaction_id: transactionId,
    };
    } catch (_error: unknown) {
      const monerooError = parseMonerooError(_error);
      logger.error("Payment initiation error:", {
        error: monerooError.message,
        code: monerooError.code,
        statusCode: monerooError.statusCode,
        details: monerooError.details,
        fullError: _error,
      });
      
      // Améliorer le message d'erreur pour les erreurs Edge Function
      if (monerooError.message.includes('non-2xx') || 
          monerooError.message.includes('Edge Function')) {
        const enhancedMessage = `Erreur Edge Function: ${monerooError.message}\n\n` +
          `💡 Vérifiez:\n` +
          `1. Les logs Supabase Edge Functions → Logs → moneroo\n` +
          `2. Que MONEROO_API_KEY est configuré dans Supabase Dashboard → Edge Functions → Secrets\n` +
          `3. Que l'Edge Function 'moneroo' est déployée`;
        throw new MonerooAPIError(enhancedMessage, monerooError.statusCode || 500, monerooError.details);
      }
      
      // Gérer l'erreur "Failed to fetch" spécifiquement
      if (monerooError.message.includes('Failed to fetch') || 
          monerooError.message.includes('connexion réseau') ||
          monerooError.message.includes('network') ||
          monerooError.message.includes('se connecter à l\'Edge Function')) {
        const enhancedMessage = `Erreur de connexion: ${monerooError.message}\n\n` +
          `💡 Vérifiez:\n` +
          `1. Votre connexion Internet\n` +
          `2. Que l'Edge Function 'moneroo' est déployée dans Supabase Dashboard\n` +
          `3. Que l'Edge Function est accessible\n` +
          `4. Les logs Supabase Edge Functions → Logs → moneroo pour plus de détails`;
        throw new MonerooNetworkError(enhancedMessage, monerooError.details);
      }
      
      // Relancer l'erreur Moneroo (déjà typée)
      throw monerooError;
    }
};

/**
 * Vérifie le statut d'une transaction et met à jour la base de données
 */
export const verifyTransactionStatus = async (transactionId: string) => {
  try {
    // Récupérer la transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error("Transaction introuvable");
    }

    // Si la transaction a déjà un statut final, retourner directement
    if (["completed", "failed", "cancelled"].includes(transaction.status)) {
      return transaction;
    }

    // Vérifier auprès de Moneroo si on a un ID de transaction
    if (transaction.moneroo_transaction_id) {
      try {
        const monerooStatus = await monerooClient.verifyPayment(
          transaction.moneroo_transaction_id
        );

        // Mettre à jour selon le statut Moneroo
        const  statusMap: Record<string, string> = {
          completed: "completed",
          success: "completed",
          failed: "failed",
          pending: "processing",
          cancelled: "cancelled",
        };

        const newStatus = statusMap[monerooStatus.status] || "processing";

        const  updates: any = {
          status: newStatus,
          moneroo_payment_method: monerooStatus.payment_method,
          moneroo_response: monerooStatus,
        };

        if (newStatus === "completed") {
          updates.completed_at = new Date().toISOString();
        } else if (newStatus === "failed") {
          updates.failed_at = new Date().toISOString();
          updates.error_message = monerooStatus.error_message || "Paiement échoué";
        }

        await supabase
          .from("transactions")
          .update(updates)
          .eq("id", transactionId);

        // Log de vérification
        await supabase.from("transaction_logs").insert([{
          transaction_id: transactionId,
          event_type: "status_updated",
          status: newStatus,
          response_data: monerooStatus,
        }]);

        // Envoyer des notifications si le statut a changé
        if (newStatus === "completed") {
          const { notifyPaymentSuccess } = await import('./moneroo-notifications');
          await notifyPaymentSuccess({
            transactionId,
            userId: transaction.customer_id,
            customerEmail: transaction.customer_email || undefined,
            customerName: transaction.customer_name || undefined,
            amount: transaction.amount,
            currency: transaction.currency || 'XOF',
            status: 'completed',
            paymentMethod: transaction.moneroo_payment_method || undefined,
            orderId: transaction.order_id || undefined,
          }).catch((err) => logger.warn('Error sending payment success notification:', err));
        } else if (newStatus === "failed") {
          const { notifyPaymentFailed } = await import('./moneroo-notifications');
          await notifyPaymentFailed({
            transactionId,
            userId: transaction.customer_id,
            customerEmail: transaction.customer_email || undefined,
            customerName: transaction.customer_name || undefined,
            amount: transaction.amount,
            currency: transaction.currency || 'XOF',
            status: 'failed',
            reason: updates.error_message,
            orderId: transaction.order_id || undefined,
          }).catch((err) => logger.warn('Error sending payment failed notification:', err));
        }

        return { ...transaction, ...updates };
      } catch (verifyError) {
        logger.error("Error verifying with Moneroo:", { error: verifyError });
        // Retourner la transaction actuelle si la vérification échoue
        return transaction;
      }
    }

    return transaction;
  } catch ( _error: unknown) {
    const monerooError = parseMonerooError(_error);
    logger.error("Transaction verification error:", {
      error: monerooError.message,
      code: monerooError.code,
      transactionId,
    });
    throw monerooError;
  }
};

/**
 * Rembourse un paiement Moneroo
 */
export const refundMonerooPayment = async (options: RefundOptions): Promise<RefundResult> => {
  const { transactionId, amount, reason } = options;

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

    // Vérifier que la transaction est complétée
    if (transaction.status !== "completed") {
      throw new MonerooValidationError(
        `Cannot refund transaction with status: ${transaction.status}`
      );
    }

    // Vérifier que c'est une transaction Moneroo
    if (transaction.payment_provider !== "moneroo" || !transaction.moneroo_transaction_id) {
      throw new MonerooValidationError("Transaction is not a Moneroo payment");
    }

    // Vérifier le montant
    const refundAmount = amount || transaction.amount;
    if (refundAmount > transaction.amount) {
      throw new MonerooValidationError("Refund amount cannot exceed transaction amount");
    }

    // Log de début de remboursement
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "refund_initiated",
      status: "processing",
      request_data: { amount: refundAmount, reason },
    }]);

    // Appeler l'API Moneroo pour le remboursement
    const refundResponse = await monerooClient.refundPayment({
      paymentId: transaction.moneroo_transaction_id,
      amount: refundAmount,
      reason: reason || "Customer request",
    });

    // Mettre à jour la transaction avec les infos de remboursement
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "refunded",
        moneroo_refund_id: refundResponse.refund_id,
        moneroo_refund_amount: refundResponse.amount,
        moneroo_refund_reason: reason || "Customer request",
        refunded_at: new Date().toISOString(),
        metadata: {
          ...(transaction.metadata as Record<string, unknown> || {}),
          refund: {
            refund_id: refundResponse.refund_id,
            amount: refundResponse.amount,
            currency: refundResponse.currency,
            status: refundResponse.status,
            created_at: refundResponse.created_at,
            reason,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      logger.error("Error updating transaction with refund:", updateError);
    }

    // 🔧 CORRECTION : Mettre à jour l'order associée pour déclencher la mise à jour de store_earnings
    if (transaction.order_id) {
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          payment_status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.order_id);

      if (orderUpdateError) {
        logger.error("Error updating order with refund:", orderUpdateError);
      } else {
        logger.log("Order updated with refund status:", {
          orderId: transaction.order_id,
          transactionId,
        });
      }
    }

    // Log de remboursement complété
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "refund_completed",
      status: "completed",
      response_data: refundResponse,
    }]);

    logger.log("Refund completed:", {
      transactionId,
      refundId: refundResponse.refund_id,
      amount: refundResponse.amount,
    });

    // Envoyer une notification de remboursement
    const { notifyPaymentRefunded } = await import('./moneroo-notifications');
    await notifyPaymentRefunded({
      transactionId,
      userId: transaction.customer_id,
      customerEmail: transaction.customer_email || undefined,
      customerName: transaction.customer_name || undefined,
      amount: refundResponse.amount,
      currency: refundResponse.currency,
      status: 'refunded',
      reason: reason || "Customer request",
      orderId: transaction.order_id || undefined,
    }).catch((err) => logger.warn('Error sending refund notification:', err));

    return {
      success: true,
      refund_id: refundResponse.refund_id,
      amount: refundResponse.amount,
      currency: refundResponse.currency,
      status: refundResponse.status,
    };
  } catch ( _error: unknown) {
    const monerooError = parseMonerooError(_error);
    
    // Log de l'erreur
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "refund_failed",
      status: "failed",
      error_data: {
        error: monerooError.message,
        code: monerooError.code,
      },
    }]).catch((err) => logger.error("Error logging refund failure:", { error: err }));

    logger.error("Refund error:", {
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






