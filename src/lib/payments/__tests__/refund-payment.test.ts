import { describe, it, expect, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
const invokeMock = vi.fn();
const refundGeniusPayPayment = vi.fn();
const loggerWarn = vi.fn();
const loggerError = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

vi.mock('@/lib/geniuspay-payment', () => ({
  refundGeniusPayPayment: (...args: unknown[]) => refundGeniusPayPayment(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarn(...args),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

vi.mock('@/lib/geniuspay-notifications', () => ({
  notifyPaymentRefunded: vi.fn().mockResolvedValue(undefined),
}));

import { refundPayment } from '../refund-payment';
import { notifyPaymentRefunded } from '@/lib/geniuspay-notifications';

function queryWith(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

describe('refundPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not found when transaction lookup fails', async () => {
    fromMock.mockReturnValue(queryWith(null, { message: 'not found' }));

    const result = await refundPayment({ transactionId: 'missing' });
    expect(result).toEqual({ success: false, error: 'Transaction not found' });
  });

  it('routes paypal_commerce to paypal-refund', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-1', payment_provider: 'paypal_commerce' }))
      .mockReturnValueOnce(queryWith({ store_id: 's1', amount: 50, currency: 'EUR' }));
    invokeMock.mockResolvedValue({
      data: { success: true, amount: 50, currency: 'EUR' },
      error: null,
    });

    const result = await refundPayment({ transactionId: 'tx-1', reason: 'test' });

    expect(result.success).toBe(true);
    expect(invokeMock).toHaveBeenCalledWith('paypal-refund', {
      body: { transactionId: 'tx-1', reason: 'test' },
    });
  });

  it('returns paypal invoke error', async () => {
    fromMock.mockReturnValueOnce(queryWith({ id: 'tx-1', payment_provider: 'paypal_commerce' }));
    invokeMock.mockResolvedValue({ data: null, error: { message: 'pp down' } });

    const result = await refundPayment({ transactionId: 'tx-1' });
    expect(result).toEqual({ success: false, error: 'pp down' });
  });

  it('returns paypal default failure when provider error missing', async () => {
    fromMock.mockReturnValueOnce(queryWith({ id: 'tx-1', payment_provider: 'paypal_commerce' }));
    invokeMock.mockResolvedValue({ data: { success: false }, error: null });

    const result = await refundPayment({ transactionId: 'tx-1' });
    expect(result).toEqual({ success: false, error: 'PayPal refund failed' });
  });

  it('routes stripe_connect to stripe-refund', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-2', payment_provider: 'stripe_connect' }))
      .mockReturnValueOnce(queryWith({ store_id: 's1', amount: 20, currency: 'EUR' }));
    invokeMock.mockResolvedValue({
      data: { success: true, amount: 20, currency: 'EUR' },
      error: null,
    });

    const result = await refundPayment({ transactionId: 'tx-2' });

    expect(result.success).toBe(true);
    expect(invokeMock).toHaveBeenCalledWith('stripe-refund', { body: { transactionId: 'tx-2' } });
  });

  it('returns stripe invoke error', async () => {
    fromMock.mockReturnValueOnce(queryWith({ id: 'tx-2', payment_provider: 'stripe_connect' }));
    invokeMock.mockResolvedValue({ data: null, error: { message: 'stripe down' } });

    const result = await refundPayment({ transactionId: 'tx-2' });
    expect(result).toEqual({ success: false, error: 'stripe down' });
  });

  it('returns stripe default failure when provider error missing', async () => {
    fromMock.mockReturnValueOnce(queryWith({ id: 'tx-2', payment_provider: 'stripe_connect' }));
    invokeMock.mockResolvedValue({ data: { success: false }, error: null });

    const result = await refundPayment({ transactionId: 'tx-2' });
    expect(result).toEqual({ success: false, error: 'Stripe refund failed' });
  });

  it('routes geniuspay provider to refundGeniusPayPayment', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-3', payment_provider: 'geniuspay_platform' }))
      .mockReturnValueOnce(queryWith({ store_id: 's1', amount: 100, currency: 'XOF' }));
    refundGeniusPayPayment.mockResolvedValue({ success: true, amount: 100, currency: 'XOF' });

    const result = await refundPayment({ transactionId: 'tx-3' });

    expect(result.success).toBe(true);
    expect(refundGeniusPayPayment).toHaveBeenCalledWith({ transactionId: 'tx-3' });
  });

  it('routes moneyfusion to moneyfusion-refund', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-mf', payment_provider: 'moneyfusion' }))
      .mockReturnValueOnce(queryWith({ store_id: 's1', amount: 500, currency: 'XOF' }));
    invokeMock.mockResolvedValue({
      data: { success: true, amount: 500, currency: 'XOF', refund_id: 'tok-1' },
      error: null,
    });

    const result = await refundPayment({ transactionId: 'tx-mf', reason: 'return' });

    expect(result.success).toBe(true);
    expect(invokeMock).toHaveBeenCalledWith('moneyfusion-refund', {
      body: { transactionId: 'tx-mf', reason: 'return' },
    });
  });

  it('returns moneyfusion invoke error', async () => {
    fromMock.mockReturnValueOnce(queryWith({ id: 'tx-mf', payment_provider: 'moneyfusion' }));
    invokeMock.mockResolvedValue({ data: null, error: { message: 'mf down' } });

    const result = await refundPayment({ transactionId: 'tx-mf' });
    expect(result).toEqual({ success: false, error: 'mf down' });
  });

  it('defaults to geniuspay when payment_provider is null', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-5', payment_provider: null }))
      .mockReturnValueOnce(queryWith({ store_id: 's1', amount: 100, currency: 'XOF' }));
    refundGeniusPayPayment.mockResolvedValue({ success: true, amount: 100, currency: 'XOF' });

    const result = await refundPayment({ transactionId: 'tx-5' });
    expect(result.success).toBe(true);
    expect(refundGeniusPayPayment).toHaveBeenCalledWith({ transactionId: 'tx-5' });
  });

  it('skips notification when refund result is unsuccessful', async () => {
    fromMock.mockReturnValueOnce(queryWith({ id: 'tx-6', payment_provider: 'geniuspay_platform' }));
    refundGeniusPayPayment.mockResolvedValue({ success: false, error: 'rejected' });

    const result = await refundPayment({ transactionId: 'tx-6' });
    expect(result.success).toBe(false);
    expect(notifyPaymentRefunded).not.toHaveBeenCalled();
  });

  it('does not notify when transaction details are missing after refund success', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-7', payment_provider: 'paypal_commerce' }))
      .mockReturnValueOnce(queryWith(null, null));
    invokeMock.mockResolvedValue({
      data: { success: true, amount: 10, currency: 'EUR' },
      error: null,
    });

    const result = await refundPayment({ transactionId: 'tx-7' });
    expect(result.success).toBe(true);
    expect(notifyPaymentRefunded).not.toHaveBeenCalled();
  });

  it('uses transaction fallbacks when notifying refund without amount/currency', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-9', payment_provider: 'stripe_connect' }))
      .mockReturnValueOnce(
        queryWith({
          store_id: null,
          customer_id: null,
          customer_email: null,
          customer_name: null,
          order_id: null,
          amount: null,
          currency: null,
        })
      );
    invokeMock.mockResolvedValue({ data: { success: true }, error: null });

    const result = await refundPayment({ transactionId: 'tx-9' });

    expect(result.success).toBe(true);
    expect(notifyPaymentRefunded).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: 'tx-9',
        amount: 0,
        currency: 'XOF',
      })
    );
  });

  it('swallows notification errors and keeps refund successful', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-8', payment_provider: 'paypal_commerce' }))
      .mockReturnValueOnce(
        queryWith({
          store_id: 's1',
          customer_id: 'u1',
          customer_email: 'buyer@example.com',
          customer_name: 'Buyer',
          order_id: 'o1',
          amount: 10,
          currency: 'EUR',
        })
      );
    invokeMock.mockResolvedValue({
      data: { success: true, amount: 10, currency: 'EUR' },
      error: null,
    });
    vi.mocked(notifyPaymentRefunded).mockRejectedValueOnce(new Error('notify failed'));

    const result = await refundPayment({ transactionId: 'tx-8' });
    expect(result.success).toBe(true);
    expect(loggerWarn).toHaveBeenCalled();
  });

  it('returns unsupported provider error', async () => {
    fromMock.mockReturnValueOnce(queryWith({ id: 'tx-4', payment_provider: 'unknown_psp' }));

    const result = await refundPayment({ transactionId: 'tx-4' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Refunds not supported');
  });
});
