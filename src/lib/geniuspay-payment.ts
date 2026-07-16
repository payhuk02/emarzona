import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { geniuspayClient, GeniusPayCheckoutData } from './geniuspay-client';
import { logger } from './logger';
import {
  parseGeniusPayError,
  GeniusPayValidationError,
  GeniusPayNetworkError,
  GeniusPayAPIError,
} from './geniuspay-errors';
import { Currency, isSupportedCurrency } from './currency-converter';
import { GeniusPayCheckoutResponse } from './geniuspay-types';
import { validateAmount } from './geniuspay-amount-validator';
import { normalizePhoneForPayment } from './validation';
import {
  sanitizeGeniusPayApiResponse,
  sanitizeGeniusPayCheckoutLog,
  sanitizePaymentOptionsForAudit,
  maskEmail,
} from './geniuspay-log-sanitize';

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
  /**
   * Override return URL used by GeniusPay checkout.
   * Defaults to /checkout/success and /checkout/cancel for order flows.
   */
  returnUrl?: string;
  cancelUrl?: string;
}

const GENIUSPAY_METADATA_MAX_ITEMS = 10;

function toGeniusPayMetadataValue(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }
  return String(value);
}

/** GeniusPay API: max 10 metadata keys, strings only. Full metadata stays in our DB. */
function buildGeniusPayApiMetadata(
  customMetadata: Record<string, unknown>,
  essentials: {
    storeId: string;
    productId?: string;
    orderId?: string;
    userId?: string;
  }
): Record<string, string> {
  const merged: Record<string, unknown> = {
    store_id: essentials.storeId,
    ...(essentials.productId ? { product_id: essentials.productId } : {}),
    ...(essentials.orderId ? { order_id: essentials.orderId } : {}),
    ...(essentials.userId ? { userId: essentials.userId } : {}),
  };

  const optionalKeys = [
    'checkout_token',
    'order_number',
    'variantId',
    'productType',
    'purpose',
    'plan_slug',
    'planSlug',
    'invoice_id',
  ] as const;

  for (const key of optionalKeys) {
    const value = customMetadata[key];
    if (value !== undefined && value !== null && value !== '') {
      merged[key] = value;
    }
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(merged)) {
    const serialized = toGeniusPayMetadataValue(value);
    if (serialized !== undefined) {
      result[key] = serialized;
    }
    if (Object.keys(result).length >= GENIUSPAY_METADATA_MAX_ITEMS) {
      break;
    }
  }

  return result;
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
export { cancelGeniusPayPayment, canCancelPayment } from './geniuspay-cancellation';
export type { CancelPaymentOptions, CancelPaymentResult } from './geniuspay-cancellation';

/**
 * Initie un paiement GeniusPay complet avec tracking dans la base de données
 */
export const initiateGeniusPayPayment = async (options: PaymentOptions) => {
  const {
    storeId,
    productId,
    orderId,
    customerId,
    amount,
    currency: requestedCurrency = 'XOF',
    description,
    customerEmail,
    customerName,
    customerPhone,
    metadata = {},
    returnUrl,
    cancelUrl,
  } = options;

  // Valider la devise
  const currency: Currency = isSupportedCurrency(requestedCurrency) ? requestedCurrency : 'XOF';

  // Valider le montant selon les limites GeniusPay
  validateAmount(amount, currency);

  // Validation des paramètres obligatoires
  if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
    logger.error('Invalid storeId in initiateGeniusPayPayment:', { storeId });
    throw new GeniusPayValidationError(`storeId invalide: ${storeId}. Doit être un UUID valide.`);
  }

  if (productId && (typeof productId !== 'string' || productId.trim() === '')) {
    logger.error('Invalid productId in initiateGeniusPayPayment:', { productId });
    throw new GeniusPayValidationError(
      `productId invalide: ${productId}. Doit être un UUID valide.`
    );
  }

  if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    logger.error('Invalid customerEmail in initiateGeniusPayPayment:', {
      customerEmailMasked: maskEmail(customerEmail),
    });
    throw new GeniusPayValidationError(
      `customerEmail invalide: ${customerEmail}. Doit être une adresse email valide.`
    );
  }

  logger.log('initiateGeniusPayPayment - Paramètres validés:', {
    storeId,
    productId,
    amount,
    currency,
    customerEmailMasked: maskEmail(customerEmail),
    hasDescription: !!description,
    hasMetadata: Object.keys(metadata).length > 0,
  });

  try {
    // Récupérer l'utilisateur actuel pour l'ajouter dans metadata
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const currentUserId = customerId || user?.id;

    // LA TRANSACTION EST MAINTENANT CREEE DE MANIERE SECURISEE PAR L'EDGE FUNCTION
    // Nous ne faisons plus d'INSERT côté client pour éviter la fraude et les problèmes de RLS.

    logger.log(
      'Initiating GeniusPay checkout via Edge Function (transaction will be created server-side)...'
    );

    // 2. Log de création de transaction temporaire (avant création serveur)
    try {
      await supabase.from('transaction_logs').insert([
        {
          event_type: 'payment_initiated_frontend',
          status: 'pending',
          request_data: sanitizePaymentOptionsForAudit(
            options as unknown as Record<string, unknown>
          ),
        },
      ]);
    } catch (_logError: unknown) {
      // Ne pas bloquer le processus si le log échoue
      logger.warn('Failed to insert transaction log (non-critical):', { error: _logError });
    }

    // 3. Initialiser le paiement GeniusPay
    // IMPORTANT: productId doit être passé directement dans data, pas seulement dans metadata
    // L'Edge Function l'extraira et l'ajoutera à metadata.product_id

    // GeniusPay limite metadata à 10 clés — le détail reste dans transactions.metadata
    const cleanMetadata = buildGeniusPayApiMetadata(metadata || {}, {
      storeId,
      productId,
      orderId,
      userId: currentUserId,
    });

    const normalizedPhone = customerPhone
      ? normalizePhoneForPayment(
          customerPhone,
          typeof metadata.customerCountry === 'string' ? metadata.customerCountry : undefined
        )
      : undefined;

    const checkoutData: GeniusPayCheckoutData = {
      amount,
      currency,
      description,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: normalizedPhone,
      return_url: returnUrl || `${window.location.origin}/payment/success`,
      cancel_url: cancelUrl || `${window.location.origin}/checkout/cancel`,
      metadata: cleanMetadata,
    };

    // Ajouter productId et storeId directement dans data pour que l'Edge Function puisse les extraire
    // L'Edge Function vérifie data.productId et l'ajoute à metadata.product_id
    const checkoutDataWithIds = {
      ...checkoutData,
      productId: productId,
      storeId: storeId,
      ...(orderId && { orderId }),
    };

    logger.log('Initiating GeniusPay checkout:', sanitizeGeniusPayCheckoutLog(checkoutDataWithIds));

    let geniuspayResponse;
    try {
      logger.log('Calling geniuspayClient.createCheckout...');
      // Passer checkoutDataWithIds qui contient productId et storeId directement
      geniuspayResponse = await geniuspayClient.createCheckout(checkoutDataWithIds);
      logger.log(
        'GeniusPay response received successfully:',
        sanitizeGeniusPayApiResponse(geniuspayResponse)
      );
    } catch (_checkoutError: unknown) {
      const error =
        _checkoutError instanceof Error ? _checkoutError : new Error(String(_checkoutError));
      logger.error('Error in geniuspayClient.createCheckout:', {
        error: _checkoutError,
        errorMessage: error.message,
        errorName: error.name,
        checkout: sanitizeGeniusPayCheckoutLog(checkoutData),
      });
      // Relancer l'erreur pour qu'elle soit gérée par le catch principal
      throw _checkoutError;
    }

    // 4. Extraire les données de la réponse GeniusPay
    // Selon la documentation GeniusPay : https://docs.geniuspay.io/
    // La réponse GeniusPay est : { message: "...", data: { id: "...", checkout_url: "..." } }
    // L'Edge Function  _retourne: { success: true, data: { message: "...", data: { id: "...", checkout_url: "..." } } }
    // Dans geniuspay-client.ts, on retourne response.data, donc geniuspayResponse est : { message: "...", data: { id: "...", checkout_url: "..." } }
    // Il faut donc accéder à geniuspayResponse.data.checkout_url et geniuspayResponse.data.id
    const typedResponse = geniuspayResponse as GeniusPayCheckoutResponse;
    const geniuspayData = typedResponse.data;

    if (!geniuspayData) {
      logger.error('GeniusPay response missing data:', geniuspayResponse);
      throw new GeniusPayAPIError(
        'La réponse GeniusPay ne contient pas de données. Vérifiez les logs Supabase pour plus de détails.',
        500,
        geniuspayResponse
      );
    }

    const checkoutUrl = geniuspayData.checkout_url;
    const geniuspayTransactionId = geniuspayData.id || geniuspayData.transaction_id;
    // La transaction locale a été insérée par l'Edge Function et son ID est retourné ici
    const localTransactionId = (geniuspayResponse as Record<string, unknown>)
      ._local_transaction_id as string | undefined;

    if (!checkoutUrl) {
      logger.error('GeniusPay response missing checkout_url:', geniuspayResponse);
      throw new GeniusPayAPIError(
        "La réponse GeniusPay ne contient pas d'URL de checkout. Vérifiez les logs Supabase pour plus de détails.",
        500,
        geniuspayResponse
      );
    }

    if (!localTransactionId) {
      logger.error('GeniusPay response missing _local_transaction_id:', geniuspayResponse);
      // On continue quand même si localTransactionId manque, mais c'est anormal
    }

    // 5. La mise à jour de la transaction est DÉJÀ FAITE côté Edge Function.
    // L'Edge Function s'est occupée d'insérer le 'geniuspay_transaction_id' et 'geniuspay_checkout_url'.

    // 6. Log du paiement initié (non-bloquant)
    try {
      if (localTransactionId) {
        await supabase.from('transaction_logs').insert([
          {
            transaction_id: localTransactionId,
            event_type: 'payment_initiated',
            status: 'processing',
            request_data: sanitizePaymentOptionsForAudit({
              ...options,
              geniuspay_transaction_id: geniuspayTransactionId,
            }),
          },
        ]);
      }
    } catch (_logError: unknown) {
      logger.warn('Failed to insert transaction log (non-critical):', { error: _logError });
    }

    return {
      success: true,
      transaction_id: localTransactionId || null,
      geniuspay_id: geniuspayTransactionId,
      checkout_url: checkoutUrl,
    };
  } catch (_error: unknown) {
    const geniuspayError = parseGeniusPayError(_error);
    logger.error('Payment initiation error:', {
      error: geniuspayError.message,
      code: geniuspayError.code,
      statusCode: geniuspayError.statusCode,
      details: geniuspayError.details,
      fullError: _error,
    });

    // Améliorer le message d'erreur pour les erreurs Edge Function
    if (
      geniuspayError.message.includes('non-2xx') ||
      geniuspayError.message.includes('Edge Function')
    ) {
      const enhancedMessage =
        `Erreur Edge Function: ${geniuspayError.message}\n\n` +
        `💡 Vérifiez:\n` +
        `1. Les logs Supabase Edge Functions → Logs → geniuspay\n` +
        `2. Que GENIUSPAY_API_KEY est configuré dans Supabase Dashboard → Edge Functions → Secrets\n` +
        `3. Que l'Edge Function 'geniuspay' est déployée`;
      throw new GeniusPayAPIError(
        enhancedMessage,
        geniuspayError.statusCode || 500,
        geniuspayError.details
      );
    }

    // Gérer l'erreur "Failed to fetch" spécifiquement
    if (
      geniuspayError.message.includes('Failed to fetch') ||
      geniuspayError.message.includes('connexion réseau') ||
      geniuspayError.message.includes('network') ||
      geniuspayError.message.includes("se connecter à l'Edge Function")
    ) {
      const enhancedMessage =
        `Erreur de connexion: ${geniuspayError.message}\n\n` +
        `💡 Vérifiez:\n` +
        `1. Votre connexion Internet\n` +
        `2. Que l'Edge Function 'geniuspay' est déployée dans Supabase Dashboard\n` +
        `3. Que l'Edge Function est accessible\n` +
        `4. Les logs Supabase Edge Functions → Logs → geniuspay pour plus de détails`;
      throw new GeniusPayNetworkError(enhancedMessage, geniuspayError.details);
    }

    // Relancer l'erreur GeniusPay (déjà typée)
    throw geniuspayError;
  }
};

/**
 * Vérifie le statut d'une transaction et met à jour la base de données
 */
export const verifyTransactionStatus = async (transactionId: string) => {
  try {
    // Récupérer la transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select(
        'id,status,order_id,store_id,customer_id,customer_email,customer_name,amount,currency,payment_provider,geniuspay_transaction_id,geniuspay_payment_method,metadata'
      )
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error('Transaction introuvable');
    }

    // Si la transaction a déjà un statut final, retourner directement
    if (['completed', 'failed', 'cancelled'].includes(transaction.status ?? '')) {
      return transaction;
    }

    // Vérifier auprès de GeniusPay si on a un ID de transaction
    if (transaction.geniuspay_transaction_id) {
      try {
        // L'Edge Function va faire l'appel à GeniusPay ET mettre à jour la base de données
        await geniuspayClient.verifyPayment(transaction.geniuspay_transaction_id);

        // Refetch la transaction pour avoir les données à jour
        const { data: updatedTransaction } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .single();

        return updatedTransaction || transaction;
      } catch (verifyError) {
        logger.error('Error verifying payment with GeniusPay:', verifyError);
        // Si l'erreur vient de GeniusPay, on la remonte
        if (
          verifyError instanceof GeniusPayAPIError ||
          verifyError instanceof GeniusPayNetworkError
        ) {
          throw verifyError;
        }
        return transaction;
      }
    }

    return transaction;
  } catch (_error: unknown) {
    const geniuspayError = parseGeniusPayError(_error);
    logger.error('Transaction verification error:', {
      error: geniuspayError.message,
      code: geniuspayError.code,
      transactionId,
    });
    throw geniuspayError;
  }
};

/**
 * Rembourse un paiement GeniusPay
 */
export const refundGeniusPayPayment = async (options: RefundOptions): Promise<RefundResult> => {
  const { transactionId, amount, reason } = options;

  try {
    // Validation
    if (!transactionId) {
      throw new GeniusPayValidationError('Transaction ID is required');
    }

    // Récupérer la transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select(
        'id,status,amount,order_id,store_id,payment_provider,geniuspay_transaction_id,metadata,customer_id,customer_email,customer_name'
      )
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new GeniusPayValidationError('Transaction not found');
    }

    // Vérifier que la transaction est remboursable
    if (!['completed', 'partially_refunded'].includes(transaction.status ?? '')) {
      throw new GeniusPayValidationError(
        `Cannot refund transaction with status: ${transaction.status}`
      );
    }

    const provider = transaction.payment_provider ?? 'geniuspay';
    const isGeniusPay =
      provider === 'geniuspay' ||
      provider === 'geniuspay_platform' ||
      !transaction.payment_provider;
    if (!isGeniusPay || !transaction.geniuspay_transaction_id) {
      throw new GeniusPayValidationError('Transaction is not a GeniusPay payment');
    }

    // Vérifier le montant (cumul partiel)
    const txAmount = transaction.amount ?? 0;
    const alreadyRefunded = Number(
      (transaction as { refunded_amount?: number }).refunded_amount ?? 0
    );
    const remaining = txAmount - alreadyRefunded;
    const refundAmount = amount ?? remaining;
    if (refundAmount > remaining + 0.01) {
      throw new GeniusPayValidationError(
        'Refund amount cannot exceed remaining transaction amount'
      );
    }

    // Log de début de remboursement
    await supabase.from('transaction_logs').insert([
      {
        transaction_id: transactionId,
        event_type: 'refund_initiated',
        status: 'processing',
        request_data: { amount: refundAmount, reason },
      },
    ]);

    // Appeler l'API GeniusPay pour le remboursement
    const refundResponse = await geniuspayClient.refundPayment({
      paymentId: transaction.geniuspay_transaction_id,
      amount: refundAmount,
      reason: reason || 'Customer request',
    });

    // Source of truth SQL (partiel ou total)
    const { data: applyResult, error: applyError } = await supabase.rpc(
      'apply_transaction_refund',
      {
        p_transaction_id: transactionId,
        p_refund_amount: refundResponse.amount,
        p_refund_id: refundResponse.refund_id,
        p_provider: 'geniuspay',
        p_reason: reason || 'Customer request',
        p_metadata: {
          refund: {
            refund_id: refundResponse.refund_id,
            amount: refundResponse.amount,
            currency: refundResponse.currency,
            status: refundResponse.status,
            created_at: refundResponse.created_at,
            reason,
          },
        } satisfies Json,
      }
    );

    if (applyError) {
      logger.error('apply_transaction_refund failed:', applyError);
      throw new GeniusPayValidationError(applyError.message);
    }

    const refundPayload = applyResult as { status?: string; refunded_amount?: number } | null;
    const rawStatus = refundPayload?.status ?? 'refunded';
    const finalStatus = rawStatus === 'partially_refunded' ? 'refunded' : rawStatus;
    const notifyStatus:
      | 'pending'
      | 'processing'
      | 'completed'
      | 'failed'
      | 'cancelled'
      | 'refunded' =
      finalStatus === 'pending' ||
      finalStatus === 'processing' ||
      finalStatus === 'completed' ||
      finalStatus === 'failed' ||
      finalStatus === 'cancelled' ||
      finalStatus === 'refunded'
        ? finalStatus
        : 'refunded';

    logger.log('Refund completed:', {
      transactionId,
      refundId: refundResponse.refund_id,
      amount: refundResponse.amount,
      status: finalStatus,
    });

    // Envoyer une notification de remboursement
    const { notifyPaymentRefunded } = await import('./geniuspay-notifications');
    await notifyPaymentRefunded({
      transactionId,
      storeId: transaction.store_id || undefined,
      userId: transaction.customer_id || undefined,
      customerEmail: transaction.customer_email || undefined,
      customerName: transaction.customer_name || undefined,
      amount: refundResponse.amount,
      currency: refundResponse.currency,
      status: notifyStatus,
      reason: reason || 'Customer request',
      orderId: transaction.order_id || undefined,
    }).catch(err => logger.warn('Error sending refund notification:', err));

    return {
      success: true,
      refund_id: refundResponse.refund_id,
      amount: refundResponse.amount,
      currency: refundResponse.currency,
      status: rawStatus,
    };
  } catch (_error: unknown) {
    const geniuspayError = parseGeniusPayError(_error);

    // Log de l'erreur
    const { error: refundFailLogErr } = await supabase.from('transaction_logs').insert([
      {
        transaction_id: transactionId,
        event_type: 'refund_failed',
        status: 'failed',
        error_data: {
          error: geniuspayError.message,
          code: geniuspayError.code,
        },
      },
    ]);
    if (refundFailLogErr) {
      logger.error('Error logging refund failure:', { error: refundFailLogErr });
    }

    logger.error('Refund error:', {
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
