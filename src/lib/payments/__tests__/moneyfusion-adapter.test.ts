import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMoneyFusionPayment } from '@/lib/payments/adapters/moneyfusion-adapter';

const initiateMoneyFusionPayment = vi.fn();
const isSupportedCurrency = vi.fn();

vi.mock('@/lib/moneyfusion-payment', () => ({
  initiateMoneyFusionPayment: (...args: unknown[]) => initiateMoneyFusionPayment(...args),
}));

vi.mock('@/lib/currency-converter', () => ({
  isSupportedCurrency: (...args: unknown[]) => isSupportedCurrency(...args),
}));

describe('createMoneyFusionPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses fallback currency XOF when unsupported', async () => {
    isSupportedCurrency.mockReturnValue(false);
    initiateMoneyFusionPayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-1',
      checkout_url: 'https://pay.moneyfusion.net/checkout/abc',
      moneyfusion_token: 'tok-1',
    });

    const result = await createMoneyFusionPayment({
      storeId: 'store-1',
      amount: 1500,
      currency: 'ABC',
      description: 'Order',
      metadata: { foo: 'bar' },
      connections: [{ id: 'c-mf', provider: 'moneyfusion' } as never],
    });

    expect(initiateMoneyFusionPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'XOF',
        metadata: expect.objectContaining({
          foo: 'bar',
          payment_orchestration_provider: 'moneyfusion',
        }),
      })
    );
    expect(result.provider).toBe('moneyfusion');
    expect(result.provider_transaction_id).toBe('tok-1');
    expect(result.connection_id).toBe('c-mf');
  });

  it('keeps supported currency and returns null connection when absent', async () => {
    isSupportedCurrency.mockReturnValue(true);
    initiateMoneyFusionPayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-2',
      checkout_url: 'https://pay.moneyfusion.net/checkout/def',
      moneyfusion_token: 'tok-2',
    });

    const result = await createMoneyFusionPayment({
      storeId: 'store-1',
      amount: 5000,
      currency: 'XOF',
      description: 'Order',
    });

    expect(initiateMoneyFusionPayment).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'XOF' })
    );
    expect(result.success).toBe(true);
    expect(result.checkout_url).toBe('https://pay.moneyfusion.net/checkout/def');
    expect(result.connection_id).toBeNull();
  });

  it('normalizes missing transaction id and token', async () => {
    isSupportedCurrency.mockReturnValue(true);
    initiateMoneyFusionPayment.mockResolvedValue({
      success: true,
      transaction_id: null,
      checkout_url: 'https://pay.moneyfusion.net/checkout/ghi',
      moneyfusion_token: null,
    });

    const result = await createMoneyFusionPayment({
      storeId: 'store-1',
      amount: 2500,
      currency: 'XOF',
      description: 'Order',
    });

    expect(result.transaction_id).toBe('');
    expect(result.provider_transaction_id).toBeUndefined();
  });
});
