import { describe, it, expect } from 'vitest';
import * as payments from '@/lib/payments';

describe('payments public index', () => {
  it('exports orchestrator and helpers', () => {
    expect(typeof payments.createOrchestratedPayment).toBe('function');
    expect(typeof payments.resolvePaymentProvider).toBe('function');
    expect(typeof payments.refundPayment).toBe('function');
    expect(typeof payments.findCompletedTransactionForOrder).toBe('function');
    expect(typeof payments.getPaymentProviderLabel).toBe('function');
    expect(typeof payments.startStripeConnectOnboarding).toBe('function');
    expect(typeof payments.createStripeConnectCheckout).toBe('function');
    expect(typeof payments.startPayPalPartnerOnboarding).toBe('function');
    expect(typeof payments.createPayPalCommerceCheckout).toBe('function');
    expect(typeof payments.useStorePaymentOptions).toBe('function');
    expect(typeof payments.rpcProviderToCheckout).toBe('function');
    expect(typeof payments.checkoutProviderToRpc).toBe('function');
    expect(typeof payments.isPaymentOrchestrationV2Enabled).toBe('function');
    expect(typeof payments.isPaymentOrchestrationV2EnabledForStore).toBe('function');
    expect(typeof payments.getPaymentOrchestrationV2RolloutPercent).toBe('function');
  });
});
