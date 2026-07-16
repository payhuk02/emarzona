import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGeniusPayPlatformPayment } from '@/lib/payments/adapters/geniuspay-adapter';

const initiateGeniusPayPayment = vi.fn();
const isSupportedCurrency = vi.fn();

vi.mock('@/lib/geniuspay-payment', () => ({
  initiateGeniusPayPayment: (...args: unknown[]) => initiateGeniusPayPayment(...args),
}));

vi.mock('@/lib/currency-converter', () => ({
  isSupportedCurrency: (...args: unknown[]) => isSupportedCurrency(...args),
}));

describe('createGeniusPayPlatformPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses fallback currency XOF when unsupported', async () => {
    isSupportedCurrency.mockReturnValue(false);
    initiateGeniusPayPayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-1',
      checkout_url: 'https://pay',
      geniuspay_id: 'm-1',
    });

    const result = await createGeniusPayPlatformPayment({
      storeId: 'store-1',
      amount: 1200,
      currency: 'ABC',
      description: 'Order',
      metadata: { foo: 'bar' },
      connections: [{ id: 'c-m', provider: 'geniuspay_platform' } as never],
    });

    expect(initiateGeniusPayPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'XOF',
        metadata: expect.objectContaining({
          foo: 'bar',
          payment_orchestration_provider: 'geniuspay_platform',
        }),
      })
    );
    expect(result.provider).toBe('geniuspay_platform');
    expect(result.connection_id).toBe('c-m');
  });

  it('keeps supported currency and maps response fields', async () => {
    isSupportedCurrency.mockReturnValue(true);
    initiateGeniusPayPayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-2',
      checkout_url: 'https://pay/2',
      geniuspay_id: 'm-2',
    });

    const result = await createGeniusPayPlatformPayment({
      storeId: 'store-1',
      amount: 500,
      currency: 'EUR',
      description: 'Order',
    });

    expect(initiateGeniusPayPayment).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'EUR' })
    );
    expect(result.provider_transaction_id).toBe('m-2');
    expect(result.connection_id).toBeNull();
  });
});
