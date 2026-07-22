/**
 * Service de paiement unifié — MoneyFusion (rail plateforme)
 */
import { verifyTransactionStatus as verifyGeniusPayTransaction } from './geniuspay-payment';
import { logger } from './logger';
import {
  createOrchestratedPayment,
  isMoneyFusionOnlyEnabled,
  isPaymentOrchestrationV2EnabledForStore,
} from './payments';
import { buildPspFallbackUserMessage } from './payments/psp-fallback-messages';
import type { PaymentProviderCode } from '@/types/store-payment-connection';
import { toast } from '@/hooks/use-toast';
import { checkRateLimit } from './rate-limiter';
import { extractCheckoutToken, withCheckoutTokenMetadata } from './checkout/checkout-access';
import {
  buildPaymentCancelReturnUrl,
  buildPaymentSuccessReturnUrl,
} from './checkout/guest-payment-return';

/** Type checkout — `geniuspay` legacy (redirigé MoneyFusion) */
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
  /** Facturation plateforme : rail MoneyFusion Emarzona */
  forcePlatformPayments?: boolean;
  /**
   * Méthode paiement legacy (ignorée — MoneyFusion gère le choix opérateur).
   */
  paymentMethod?: import('./geniuspay-types').GeniusPayPaymentMethod | null;
  /** Code opérateur MMO (optionnel) */
  mmoProvider?: string;
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
  if (!provider || provider === 'geniuspay' || provider === 'geniuspay_platform') {
    return 'moneyfusion';
  }
  if (provider === 'moneyfusion') {
    return 'moneyfusion';
  }
  return provider as PaymentProviderCode;
}

function toCheckoutProvider(provider: PaymentProviderCode): PaymentProvider {
  if (provider === 'geniuspay_platform') return 'moneyfusion';
  return provider;
}

/**
 * Initie un paiement (MoneyFusion plateforme / orchestrateur V2)
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

async function initiateMoneyFusionOnly(options: PaymentOptions): Promise<PaymentResult> {
  try {
    const { createMoneyFusionPayment } = await import('./payments/adapters/moneyfusion-adapter');
    const result = await createMoneyFusionPayment({
      storeId: options.storeId,
      productId: options.productId,
      orderId: options.orderId,
      customerId: options.customerId,
      amount: options.amount,
      currency: options.currency,
      description: options.description,
      customerEmail: options.customerEmail,
      customerName: options.customerName,
      customerPhone: options.customerPhone,
      metadata: options.metadata,
      returnUrl: options.returnUrl,
      cancelUrl: options.cancelUrl,
    });

    return {
      success: result.success && !!result.checkout_url,
      transaction_id: result.transaction_id,
      checkout_url: result.checkout_url ?? '',
      provider: 'moneyfusion',
      provider_transaction_id: result.provider_transaction_id,
      error: result.error,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'initialiser le paiement MoneyFusion";
    logger.error('MoneyFusion initiation failed', { error });
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'moneyfusion',
      error: message,
    };
  }
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
      provider: options.provider ?? 'moneyfusion',
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
      provider: 'moneyfusion',
      provider_transaction_id: 'e2e-stub',
    };
  }

  // Rail plateforme : MoneyFusion uniquement (GeniusPay retiré).
  if (isMoneyFusionOnlyEnabled()) {
    return initiateMoneyFusionOnly({ ...resolvedOptions, provider: 'moneyfusion' });
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
        paymentMethod: resolvedOptions.paymentMethod,
        mmoProvider: resolvedOptions.mmoProvider,
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

      logger.warn('Orchestrator returned failure, falling back to MoneyFusion', {
        error: orchestrated.error,
        orderId: resolvedOptions.orderId,
        storeId: resolvedOptions.storeId,
      });
    } catch (error: unknown) {
      logger.error('CRITICAL: Orchestrator initiatePayment failed, falling back to MoneyFusion', {
        error,
        orderId: options.orderId,
        storeId: options.storeId,
      });

      toast({
        title: 'Information de paiement',
        description:
          'Le système de paiement principal est temporairement indisponible. Redirection vers MoneyFusion.',
      });
    }
  }

  // MoneyFusion (rail plateforme) — GeniusPay retiré
  return initiateMoneyFusionOnly({ ...resolvedOptions, provider: 'moneyfusion' });
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
    provider ?? (transaction?.payment_provider as PaymentProvider) ?? 'moneyfusion';

  const connectProviders = ['stripe_connect', 'paypal_commerce', 'paypal'];
  if (connectProviders.includes(resolvedProvider)) {
    return transaction ?? { id: transactionId, status: 'unknown' };
  }

  if (!transaction?.geniuspay_transaction_id) {
    return transaction ?? { id: transactionId, status: 'unknown' };
  }

  return verifyGeniusPayTransaction(transactionId);
};
