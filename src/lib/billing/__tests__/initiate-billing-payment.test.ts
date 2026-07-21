import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initiateBillingCheckout } from '../initiate-billing-payment';

const initiatePayment = vi.fn();
const resolveBillingCustomerPhone = vi.fn();
const requireBillingCustomerPhone = vi.fn();
const isMoneyFusionOnlyEnabled = vi.fn();

vi.mock('@/lib/payment-service', () => ({
  initiatePayment: (...args: unknown[]) => initiatePayment(...args),
}));

vi.mock('@/lib/billing/billing-contact', () => ({
  resolveBillingCustomerPhone: (...args: unknown[]) => resolveBillingCustomerPhone(...args),
  requireBillingCustomerPhone: (...args: unknown[]) => requireBillingCustomerPhone(...args),
}));

vi.mock('@/lib/payments/feature-flags', () => ({
  isMoneyFusionOnlyEnabled: (...args: unknown[]) => isMoneyFusionOnlyEnabled(...args),
}));

describe('initiateBillingCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initiatePayment.mockResolvedValue({
      success: true,
      transaction_id: 'tx-1',
      checkout_url: 'https://checkout.example/session',
      provider: 'geniuspay',
    });
    resolveBillingCustomerPhone.mockResolvedValue(null);
    requireBillingCustomerPhone.mockResolvedValue('+22670000000');
    isMoneyFusionOnlyEnabled.mockReturnValue(false);
  });

  it('délègue à initiatePayment avec forcePlatformPayments et metadata billing', async () => {
    const url = await initiateBillingCheckout({
      storeId: 'store-1',
      amount: 2900,
      currency: 'USD',
      description: 'Abonnement test',
      customerEmail: 'vendor@example.com',
      customerName: 'Vendor',
      purpose: 'physical_subscription',
      planSlug: 'physical_standard',
    });

    expect(url).toBe('https://checkout.example/session');
    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store-1',
        amount: 2900,
        currency: 'USD',
        forcePlatformPayments: true,
        metadata: {
          purpose: 'physical_subscription',
          plan_slug: 'physical_standard',
          product_type: 'physical',
        },
        returnUrl: expect.stringContaining('/dashboard/billing/physical?success=1'),
        cancelUrl: expect.stringContaining('/dashboard/billing/physical?cancel=1'),
      })
    );
  });

  it('inclut invoice_id et successQuery pour renouvellement / upgrade', async () => {
    await initiateBillingCheckout({
      storeId: 'store-1',
      amount: 1500,
      currency: 'XOF',
      description: 'Upgrade',
      customerEmail: 'v@e.com',
      purpose: 'physical_plan_change',
      planSlug: 'physical_professional',
      invoiceId: 'inv-99',
      successQuery: { plan_change: '1' },
    });

    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          purpose: 'physical_plan_change',
          invoice_id: 'inv-99',
        }),
        returnUrl: expect.stringContaining('plan_change=1'),
      })
    );
  });

  it('résout le téléphone profil quand il est connu (MoneyFusion)', async () => {
    resolveBillingCustomerPhone.mockResolvedValue('+22675000000');

    await initiateBillingCheckout({
      storeId: 'store-1',
      amount: 2900,
      currency: 'XOF',
      description: 'Abonnement',
      customerEmail: 'v@e.com',
      purpose: 'physical_subscription',
      planSlug: 'physical_standard',
    });

    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ customerPhone: '+22675000000' })
    );
    expect(requireBillingCustomerPhone).not.toHaveBeenCalled();
  });

  it('exige un téléphone (saisie utilisateur) en mode MoneyFusion-only', async () => {
    isMoneyFusionOnlyEnabled.mockReturnValue(true);

    await initiateBillingCheckout({
      storeId: 'store-1',
      amount: 2900,
      currency: 'XOF',
      description: 'Abonnement',
      customerEmail: 'v@e.com',
      purpose: 'physical_subscription',
      planSlug: 'physical_standard',
    });

    expect(requireBillingCustomerPhone).toHaveBeenCalled();
    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ customerPhone: '+22670000000' })
    );
  });

  it('privilégie le téléphone passé explicitement', async () => {
    await initiateBillingCheckout({
      storeId: 'store-1',
      amount: 100,
      currency: 'XOF',
      description: 'Test',
      customerEmail: 'v@e.com',
      customerPhone: '+22660000000',
      purpose: 'physical_subscription',
      planSlug: 'physical_basic',
    });

    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ customerPhone: '+22660000000' })
    );
    expect(resolveBillingCustomerPhone).not.toHaveBeenCalled();
    expect(requireBillingCustomerPhone).not.toHaveBeenCalled();
  });

  it('propage l’erreur si le paiement échoue', async () => {
    initiatePayment.mockResolvedValue({
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'geniuspay',
      error: 'Rate limited',
    });

    await expect(
      initiateBillingCheckout({
        storeId: 'store-1',
        amount: 100,
        currency: 'XOF',
        description: 'Test',
        customerEmail: 'v@e.com',
        purpose: 'physical_subscription_renewal',
        planSlug: 'physical_standard',
      })
    ).rejects.toThrow('Rate limited');
  });
});
