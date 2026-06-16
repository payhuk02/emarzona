import { describe, expect, it } from 'vitest';
import { getMarketplaceProductCTA } from '@/lib/marketplace-product-cta';

describe('getMarketplaceProductCTA', () => {
  it('uses vendor physical button label and quick order action', () => {
    const cta = getMarketplaceProductCTA('physical', {
      checkout_method: 'cash_on_delivery',
      cta_button_label: 'Payer à la livraison',
      payment_type: 'full',
      percentage_rate: 30,
    });

    expect(cta.action).toBe('physical_quick_order');
    expect(cta.buyLabel).toBe('Payer à la livraison');
    expect(cta.showPhysicalCheckoutBadge).toBe(true);
    expect(cta.showAddToCart).toBe(false);
  });

  it('keeps service and course defaults', () => {
    expect(getMarketplaceProductCTA('service').buyLabel).toBe('Réserver');
    expect(getMarketplaceProductCTA('course').buyLabel).toBe("S'inscrire");
  });
});
