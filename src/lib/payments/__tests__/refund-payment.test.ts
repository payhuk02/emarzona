import { describe, it, expect, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
const invokeMock = vi.fn();
const refundMonerooPayment = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

vi.mock('@/lib/moneroo-payment', () => ({
  refundMonerooPayment: (...args: unknown[]) => refundMonerooPayment(...args),
}));

vi.mock('@/lib/moneroo-notifications', () => ({
  notifyPaymentRefunded: vi.fn().mockResolvedValue(undefined),
}));

import { refundPayment } from '../refund-payment';

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

  it('routes moneroo provider to refundMonerooPayment', async () => {
    fromMock
      .mockReturnValueOnce(queryWith({ id: 'tx-3', payment_provider: 'moneroo_platform' }))
      .mockReturnValueOnce(queryWith({ store_id: 's1', amount: 100, currency: 'XOF' }));
    refundMonerooPayment.mockResolvedValue({ success: true, amount: 100, currency: 'XOF' });

    const result = await refundPayment({ transactionId: 'tx-3' });

    expect(result.success).toBe(true);
    expect(refundMonerooPayment).toHaveBeenCalledWith({ transactionId: 'tx-3' });
  });

  it('returns unsupported provider error', async () => {
    fromMock.mockReturnValueOnce(queryWith({ id: 'tx-4', payment_provider: 'unknown_psp' }));

    const result = await refundPayment({ transactionId: 'tx-4' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Refunds not supported');
  });
});
