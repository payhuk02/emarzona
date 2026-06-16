import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMonerooPlatformPayment } from '@/lib/payments/adapters/moneroo-adapter';

const initiateMonerooPayment = vi.fn();
const isSupportedCurrency = vi.fn();

vi.mock('@/lib/moneroo-payment', () => ({
  initiateMonerooPayment: (...args: unknown[]) => initiateMonerooPayment(...args),
}));

vi.mock('@/lib/currency-converter', () => ({
  isSupportedCurrency: (...args: unknown[]) => isSupportedCurrency(...args),
}));

describe('createMonerooPlatformPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses fallback currency XOF when unsupported', async () => {
    isSupportedCurrency.mockReturnValue(false);
    initiateMonerooPayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-1',
      checkout_url: 'https://pay',
      moneroo_transaction_id: 'm-1',
    });

    const result = await createMonerooPlatformPayment({
      storeId: 'store-1',
      amount: 1200,
      currency: 'ABC',
      description: 'Order',
      metadata: { foo: 'bar' },
      connections: [{ id: 'c-m', provider: 'moneroo_platform' } as never],
    });

    expect(initiateMonerooPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'XOF',
        metadata: expect.objectContaining({
          foo: 'bar',
          payment_orchestration_provider: 'moneroo_platform',
        }),
      })
    );
    expect(result.provider).toBe('moneroo_platform');
    expect(result.connection_id).toBe('c-m');
  });

  it('keeps supported currency and maps response fields', async () => {
    isSupportedCurrency.mockReturnValue(true);
    initiateMonerooPayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-2',
      checkout_url: 'https://pay/2',
      moneroo_transaction_id: 'm-2',
    });

    const result = await createMonerooPlatformPayment({
      storeId: 'store-1',
      amount: 500,
      currency: 'EUR',
      description: 'Order',
    });

    expect(initiateMonerooPayment).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'EUR' })
    );
    expect(result.provider_transaction_id).toBe('m-2');
    expect(result.connection_id).toBeNull();
  });
});
