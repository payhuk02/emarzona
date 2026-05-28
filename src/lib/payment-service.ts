/**
 * Service de paiement unifié
 * Moneroo (legacy) ou orchestrateur V2 (feature flag)
 */
import {
  initiateMonerooPayment,
  verifyTransactionStatus as verifyMonerooTransaction,
} from './moneroo-payment';
import { logger } from './logger';
import { isSupportedCurrency, type Currency } from './currency-converter';
import { isPaymentOrchestrationV2Enabled, createOrchestratedPayment } from './payments';
import type { PaymentProviderCode } from '@/types/store-payment-connection';
import { toast } from '@/hooks/use-toast';

/** Type checkout — `moneroo` legacy UI ; codes orchestrateur après migration UI */
export type PaymentProvider = 'moneroo' | PaymentProviderCode;

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
  provider?: PaymentProvider;
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
  if (!provider || provider === 'moneroo') {
    return 'moneroo_platform';
  }
  if (provider === 'moneroo_platform') {
    return 'moneroo_platform';
  }
  return provider as PaymentProviderCode;
}

function toCheckoutProvider(provider: PaymentProviderCode): PaymentProvider {
  return provider === 'moneroo_platform' ? 'moneroo' : provider;
}

/**
 * Initie un paiement avec le provider spécifié (ou Moneroo par défaut)
 */
export const initiatePayment = async (options: PaymentOptions): Promise<PaymentResult> => {
  if (isPaymentOrchestrationV2Enabled()) {
    try {
      const orchestrated = await createOrchestratedPayment({
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
        preferredProvider: toOrchestratorPreferred(options.provider),
      });

      return {
        success: orchestrated.success,
        transaction_id: orchestrated.transaction_id,
        checkout_url: orchestrated.checkout_url,
        provider: toCheckoutProvider(orchestrated.provider),
        provider_transaction_id: orchestrated.provider_transaction_id,
        error: orchestrated.error,
      };
    } catch (error: unknown) {
      logger.error('CRITICAL: Orchestrator initiatePayment failed, falling back to Moneroo', {
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
    logger.log('Initiating Moneroo payment', { orderId: options.orderId });
    const currency: Currency | undefined =
      options.currency && isSupportedCurrency(options.currency) ? options.currency : 'XOF';

    const monerooResult = await initiateMonerooPayment({
      ...options,
      currency,
    });

    return {
      success: monerooResult.success,
      transaction_id: monerooResult.transaction_id,
      checkout_url: monerooResult.checkout_url,
      provider: 'moneroo',
      provider_transaction_id: monerooResult.moneroo_transaction_id,
    };
  } catch (_error: unknown) {
    const errorObj = _error instanceof Error ? _error : new Error(String(_error));
    const errorMessage = errorObj.message || "Erreur inconnue lors de l'initiation du paiement";
    logger.error('Payment initiation error:', { error: errorObj });
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: options.provider ?? 'moneroo',
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
  if (!provider) {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: transaction } = await supabase
      .from('transactions')
      .select('payment_provider')
      .eq('id', transactionId)
      .single();

    provider = (transaction?.payment_provider as PaymentProvider) || 'moneroo';
  }

  return verifyMonerooTransaction(transactionId);
};
