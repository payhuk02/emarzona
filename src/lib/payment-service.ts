/**
 * Service de paiement unifié
 * GeniusPay (legacy) ou orchestrateur V2 (feature flag)
 */
import {
  initiateGeniusPayPayment,
  verifyTransactionStatus as verifyGeniusPayTransaction,
} from './geniuspay-payment';
import { logger } from './logger';
import { isSupportedCurrency, type Currency } from './currency-converter';
import { isPaymentOrchestrationV2EnabledForStore, createOrchestratedPayment } from './payments';
import { buildPspFallbackUserMessage } from './payments/psp-fallback-messages';
import type { PaymentProviderCode } from '@/types/store-payment-connection';
import { toast } from '@/hooks/use-toast';
import { checkRateLimit } from './rate-limiter';
import { extractCheckoutToken, withCheckoutTokenMetadata } from './checkout/checkout-access';
import {
  buildPaymentCancelReturnUrl,
  buildPaymentSuccessReturnUrl,
} from './checkout/guest-payment-return';

/** Type checkout — `geniuspay` legacy UI ; codes orchestrateur après migration UI */
export type PaymentProvider = 'geniuspay' | PaymentProviderCode;

export interface PaymentOptions {
  storeId: string;
  productId?: string;
  orderId?: string;
  customerId?: string;
  amount: number;
  currency?: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
  checkoutToken?: string;
  provider?: PaymentProvider;
  /** URLs de retour après checkout PSP (billing, abonnements) */
  returnUrl?: string;
  cancelUrl?: string;
  /** Facturation plateforme : rail GeniusPay Emarzona uniquement */
  forcePlatformPayments?: boolean;
}

export interface PaymentResult {
  success: boolean;
  transaction_id: string;
  checkout_url: string;
  provider: PaymentProvider;
  provider_transaction_id?: string;
  error?: string;
}

function toOrchestratorPreferred(provider?: PaymentProvider): PaymentProviderCode | undefined {
  if (!provider || provider === 'geniuspay') {
    return 'geniuspay_platform';
  }
  if (provider === 'geniuspay_platform') {
    return 'geniuspay_platform';
  }
  return provider as PaymentProviderCode;
}

function toCheckoutProvider(provider: PaymentProviderCode): PaymentProvider {
  return provider === 'geniuspay_platform' ? 'geniuspay' : provider;
}

/**
 * Initie un paiement avec le provider spécifié (ou GeniusPay par défaut)
 */
async function resolvePaymentContext(options: PaymentOptions): Promise<PaymentOptions> {
  const { supabase } = await import('@/integrations/supabase/client');
  let checkoutToken = options.checkoutToken ?? extractCheckoutToken(options.metadata);

  if (!checkoutToken && options.orderId) {
    const { data: order } = await supabase
      .from('orders')
      .select('metadata')
      .eq('id', options.orderId)
      .maybeSingle();
    checkoutToken = extractCheckoutToken(order?.metadata);
  }

  // #region agent log
  fetch('http://127.0.0.1:7740/ingest/c21af8ec-02ef-48c9-95f8-23aa8fa2c366', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fed886' },
    body: JSON.stringify({
      sessionId: 'fed886',
      hypothesisId: 'H4-digital-payment-auth',
      location: 'payment-service.ts:resolvePaymentContext',
      message: 'Payment context resolved',
      data: {
        orderId: options.orderId ?? null,
        hasCheckoutToken: !!checkoutToken,
        tokenFromOptions: !!options.checkoutToken,
        tokenFromMetadata: !!extractCheckoutToken(options.metadata),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    ...options,
    metadata: withCheckoutTokenMetadata(options.metadata, checkoutToken),
    checkoutToken,
    returnUrl:
      options.returnUrl ??
      (options.orderId
        ? buildPaymentSuccessReturnUrl({
            orderId: options.orderId,
            guestEmail: options.customerEmail,
            productType:
              typeof options.metadata?.product_type === 'string'
                ? options.metadata.product_type
                : undefined,
            guest: options.metadata?.guest_checkout === true,
          })
        : options.returnUrl),
    cancelUrl:
      options.cancelUrl ??
      (options.orderId ? buildPaymentCancelReturnUrl(options.orderId) : options.cancelUrl),
  };
}

export const initiatePayment = async (options: PaymentOptions): Promise<PaymentResult> => {
  const { supabase } = await import('@/integrations/supabase/client');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rate = await checkRateLimit('payment', user?.id);
  if (!rate.allowed) {
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: options.provider ?? 'geniuspay',
      error: rate.message || 'Trop de tentatives de paiement. Réessayez plus tard.',
    };
  }

  const resolvedOptions = await resolvePaymentContext(options);

  // E2E local: ne dépend pas des secrets PSP / réseau externe.
  if (import.meta.env.DEV && import.meta.env.VITE_E2E_PAYMENT_STUB === 'true') {
    const orderId = typeof resolvedOptions.orderId === 'string' ? resolvedOptions.orderId : '';
    return {
      success: true,
      transaction_id: `e2e-${Date.now()}`,
      checkout_url: `/checkout?e2e=1${orderId ? `&orderId=${encodeURIComponent(orderId)}` : ''}`,
      provider: 'geniuspay',
      provider_transaction_id: 'e2e-stub',
    };
  }

  if (isPaymentOrchestrationV2EnabledForStore(resolvedOptions.storeId)) {
    try {
      const orchestrated = await createOrchestratedPayment({
        storeId: resolvedOptions.storeId,
        productId: resolvedOptions.productId,
        orderId: resolvedOptions.orderId,
        customerId: resolvedOptions.customerId,
        amount: resolvedOptions.amount,
        currency: resolvedOptions.currency,
        description: resolvedOptions.description,
        customerEmail: resolvedOptions.customerEmail,
        customerName: resolvedOptions.customerName,
        customerPhone: resolvedOptions.customerPhone,
        metadata: resolvedOptions.metadata,
        returnUrl: resolvedOptions.returnUrl,
        cancelUrl: resolvedOptions.cancelUrl,
        forcePlatformPayments: resolvedOptions.forcePlatformPayments,
        preferredProvider: toOrchestratorPreferred(resolvedOptions.provider),
      });

      if (orchestrated.success && orchestrated.checkout_url) {
        if (orchestrated.psp_fallback) {
          const msg = buildPspFallbackUserMessage(
            orchestrated.psp_fallback.from_provider,
            orchestrated.psp_fallback.reason
          );
          toast({
            title: msg.title,
            description: msg.description,
            duration: 12_000,
          });
        }

        return {
          success: true,
          transaction_id: orchestrated.transaction_id,
          checkout_url: orchestrated.checkout_url,
          provider: toCheckoutProvider(orchestrated.provider),
          provider_transaction_id: orchestrated.provider_transaction_id,
        };
      }

      logger.warn('Orchestrator returned failure, falling back to GeniusPay', {
        error: orchestrated.error,
        orderId: resolvedOptions.orderId,
        storeId: resolvedOptions.storeId,
      });
    } catch (error: unknown) {
      logger.error('CRITICAL: Orchestrator initiatePayment failed, falling back to GeniusPay', {
        error,
        orderId: options.orderId,
        storeId: options.storeId,
      });

      toast({
        title: 'Information de paiement',
        description:
          'Le système de paiement principal est temporairement indisponible. Redirection vers le système de secours.',
      });
    }
  }

  try {
    logger.log('Initiating GeniusPay payment', { orderId: options.orderId });
    const currency: Currency | undefined =
      options.currency && isSupportedCurrency(options.currency) ? options.currency : 'XOF';

    const geniuspayResult = await initiateGeniusPayPayment({
      ...resolvedOptions,
      currency,
      returnUrl: resolvedOptions.returnUrl,
      cancelUrl: resolvedOptions.cancelUrl,
    });

    return {
      success: geniuspayResult.success,
      transaction_id: geniuspayResult.transaction_id,
      checkout_url: geniuspayResult.checkout_url,
      provider: 'geniuspay',
      provider_transaction_id: geniuspayResult.geniuspay_transaction_id,
      error: geniuspayResult.success ? undefined : 'Paiement GeniusPay non initialisé',
    };
  } catch (_error: unknown) {
    const errorObj = _error instanceof Error ? _error : new Error(String(_error));
    const errorMessage = errorObj.message || "Erreur inconnue lors de l'initiation du paiement";
    logger.error('Payment initiation error:', { error: errorObj });
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: options.provider ?? 'geniuspay',
      error: errorMessage,
    };
  }
};

/**
 * Vérifie le statut d'une transaction
 */
export const verifyTransactionStatus = async (
  transactionId: string,
  provider?: PaymentProvider
) => {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: transaction } = await supabase
    .from('transactions')
    .select('id, status, payment_provider, geniuspay_transaction_id')
    .eq('id', transactionId)
    .single();

  const resolvedProvider =
    provider ?? (transaction?.payment_provider as PaymentProvider) ?? 'geniuspay';

  const connectProviders = ['stripe_connect', 'paypal_commerce', 'paypal'];
  if (connectProviders.includes(resolvedProvider)) {
    return transaction ?? { id: transactionId, status: 'unknown' };
  }

  if (!transaction?.geniuspay_transaction_id) {
    return transaction ?? { id: transactionId, status: 'unknown' };
  }

  return verifyGeniusPayTransaction(transactionId);
};
