import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initiateMarketplaceDirectBuy } from '../initiate-direct-buy';

const initiatePayment = vi.fn();

vi.mock('@/lib/payment-service', () => ({
  initiatePayment: (...args: unknown[]) => initiatePayment(...args),
}));

describe('initiateMarketplaceDirectBuy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initiatePayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-42',
      checkout_url: 'https://checkout.example/session',
      provider: 'stripe_connect',
    });
  });

  it('délègue à initiatePayment sans forcePlatformPayments', async () => {
    const result = await initiateMarketplaceDirectBuy({
      storeId: 'store-1',
      productId: 'prod-1',
      amount: 5000,
      currency: 'XOF',
      description: 'Achat de Widget',
      customerEmail: 'buyer@example.com',
      customerName: 'Buyer',
      productName: 'Widget',
      storeSlug: 'my-store',
      guestCheckout: true,
    });

    expect(result.checkout_url).toBe('https://checkout.example/session');
    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store-1',
        productId: 'prod-1',
        amount: 5000,
        currency: 'XOF',
        customerEmail: 'buyer@example.com',
        metadata: expect.objectContaining({
          productName: 'Widget',
          storeSlug: 'my-store',
          guest_checkout: true,
        }),
      })
    );
    expect(initiatePayment.mock.calls[0][0]).not.toHaveProperty('forcePlatformPayments');
  });

  it('normalise la devise invalide vers XOF', async () => {
    await initiateMarketplaceDirectBuy({
      storeId: 'store-1',
      productId: 'prod-1',
      amount: 100,
      currency: 'INVALID',
      description: 'Test',
      customerEmail: 'b@e.com',
    });

    expect(initiatePayment).toHaveBeenCalledWith(expect.objectContaining({ currency: 'XOF' }));
  });

  it('retourne le résultat d’échec sans throw', async () => {
    initiatePayment.mockResolvedValue({
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'moneroo',
      error: 'PSP unavailable',
    });

    const result = await initiateMarketplaceDirectBuy({
      storeId: 'store-1',
      productId: 'prod-1',
      amount: 100,
      description: 'Test',
      customerEmail: 'b@e.com',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('PSP unavailable');
  });
});
