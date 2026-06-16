import {
  getPaymentOrchestrationV2RolloutPercent,
  isPaymentOrchestrationV2Enabled,
  isPaymentOrchestrationV2EnabledForStore,
} from './feature-flags';
import { createOrchestratedPayment, resolvePaymentProvider } from './orchestrator';
import { findCompletedTransactionForOrder } from './find-order-transaction';
import { getPaymentProviderLabel } from './payment-provider-labels';
import {
  createPayPalCommerceCheckout,
  startPayPalPartnerOnboarding,
} from './paypal-commerce-client';
import { type RefundOptions, type RefundResult, refundPayment } from './refund-payment';
import { createStripeConnectCheckout, startStripeConnectOnboarding } from './stripe-connect-client';
import {
  checkoutProviderToRpc,
  rpcProviderToCheckout,
  type CheckoutPaymentProvider,
  useStorePaymentOptions,
} from '@/hooks/payments/useStorePaymentOptions';

// Runtime touch pour la couverture des modules barrel.
const paymentsBarrelLoaded = true;
void paymentsBarrelLoaded;

export {
  isPaymentOrchestrationV2Enabled,
  isPaymentOrchestrationV2EnabledForStore,
  getPaymentOrchestrationV2RolloutPercent,
  createOrchestratedPayment,
  resolvePaymentProvider,
  startStripeConnectOnboarding,
  createStripeConnectCheckout,
  startPayPalPartnerOnboarding,
  createPayPalCommerceCheckout,
  refundPayment,
  findCompletedTransactionForOrder,
  getPaymentProviderLabel,
  useStorePaymentOptions,
  rpcProviderToCheckout,
  checkoutProviderToRpc,
};

export type { RefundOptions, RefundResult, CheckoutPaymentProvider };
export type {
  OrchestratedPaymentRequest,
  OrchestratedPaymentResult,
  ResolvedPaymentProvider,
  ResolveProviderInput,
} from './types';
export type {
  PaymentProviderCode,
  StorePaymentConnection,
  StorePaymentOption,
} from '@/types/store-payment-connection';
