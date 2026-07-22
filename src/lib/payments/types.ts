/**
 * Types canoniques — orchestrateur paiements
 */

import type { PaymentProviderCode, StorePaymentConnection } from '@/types/store-payment-connection';

export type { PaymentProviderCode, StorePaymentConnection };

export interface ResolveProviderInput {
  storeId: string;
  amount: number;
  currency: string;
  buyerCountry?: string | null;
  productTypes?: string[];
  isMultiStoreCart?: boolean;
  buyerPreferredProvider?: PaymentProviderCode | null;
  forcePlatformPayments?: boolean;
  connections: StorePaymentConnection[];
}

export interface ResolvedPaymentProvider {
  provider: PaymentProviderCode;
  connectionId: string | null;
  reason: string;
}

export interface OrchestratedPaymentRequest {
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
  /** URLs de retour checkout (abonnements, billing vendeur) */
  returnUrl?: string;
  cancelUrl?: string;
  /** Forcer un provider (tests / admin) */
  preferredProvider?: PaymentProviderCode;
  connections?: StorePaymentConnection[];
  /** Abonnements plateforme : toujours GeniusPay plateforme, jamais Stripe/PayPal vendeur */
  forcePlatformPayments?: boolean;
  /**
   * Méthode GeniusPay (`payment_method`). Défaut pawapay côté adapter.
   * `null` = page checkout GeniusPay (choix client).
   */
  paymentMethod?: import('@/lib/geniuspay-types').GeniusPayPaymentMethod | null;
  mmoProvider?: string;
}

export interface PspFallbackInfo {
  from_provider: PaymentProviderCode;
  /** Rail de secours plateforme (MoneyFusion ; geniuspay_platform = legacy) */
  to_provider: 'moneyfusion' | 'geniuspay_platform';
  reason: string;
}

export interface OrchestratedPaymentResult {
  success: boolean;
  transaction_id: string;
  checkout_url: string;
  provider: PaymentProviderCode;
  provider_transaction_id?: string;
  connection_id?: string | null;
  error?: string;
  /** Présent si le PSP initial a été remplacé par MoneyFusion (legacy: GeniusPay) */
  psp_fallback?: PspFallbackInfo;
}

export class PaymentProviderNotReadyError extends Error {
  constructor(
    public readonly provider: PaymentProviderCode,
    message?: string
  ) {
    super(message ?? `Payment provider "${provider}" is not available yet`);
    this.name = 'PaymentProviderNotReadyError';
  }
}
