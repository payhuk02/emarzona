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
  /** Forcer un provider (tests / admin) */
  preferredProvider?: PaymentProviderCode;
  connections?: StorePaymentConnection[];
  forcePlatformPayments?: boolean;
}

export interface OrchestratedPaymentResult {
  success: boolean;
  transaction_id: string;
  checkout_url: string;
  provider: PaymentProviderCode;
  provider_transaction_id?: string;
  connection_id?: string | null;
  error?: string;
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
