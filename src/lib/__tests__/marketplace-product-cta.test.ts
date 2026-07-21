import { describe, expect, it } from 'vitest';
import { getMarketplaceProductCTA } from '@/lib/marketplace-product-cta';

describe('getMarketplaceProductCTA', () => {
  it('routes physical COD to checkout with vendor CTA label', () => {
    const cta = getMarketplaceProductCTA('physical', {
      checkout_method: 'cash_on_delivery',
      cta_button_label: 'Payer à la livraison',
      payment_type: 'full',
      percentage_rate: 30,
    });

    expect(cta.action).toBe('checkout');
    expect(cta.buyLabel).toBe('Payer à la livraison');
    expect(cta.showPhysicalCheckoutBadge).toBe(true);
    expect(cta.showAddToCart).toBe(false);
  });

  it('routes physical online payment to checkout with vendor CTA label', () => {
    const cta = getMarketplaceProductCTA('physical', {
      checkout_method: 'online',
      cta_button_label: 'Acheter en ligne',
      payment_type: 'full',
      percentage_rate: 30,
    });

    expect(cta.action).toBe('checkout');
    expect(cta.buyLabel).toBe('Acheter en ligne');
    expect(cta.showPhysicalCheckoutBadge).toBe(true);
  });

  it('keeps service and course defaults', () => {
    expect(getMarketplaceProductCTA('service').buyLabel).toBe('Réserver');
    expect(getMarketplaceProductCTA('course').buyLabel).toBe("S'inscrire");
  });
});
