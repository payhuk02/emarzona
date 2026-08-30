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

  it('routes physical guarantee checkout to checkout with vendor CTA', () => {
    const cta = getMarketplaceProductCTA('physical', {
      checkout_method: 'guarantee',
      cta_button_label: 'Payer la garantie',
      payment_type: 'full',
      percentage_rate: 30,
      guarantee_amount: 4000,
    });

    expect(cta.action).toBe('checkout');
    expect(cta.buyLabel).toBe('Payer la garantie');
    expect(cta.showPhysicalCheckoutBadge).toBe(true);
    expect(cta.showAddToCart).toBe(false);
  });

  it('keeps service default and supports vendor CTA label', () => {
    const defaultCta = getMarketplaceProductCTA('service');
    expect(defaultCta.action).toBe('service');
    expect(defaultCta.buyLabel).toBe('Réserver');
    const customCta = getMarketplaceProductCTA('service', {
      payment_type: 'full',
      cta_button_label: 'En savoir plus',
    });
    expect(customCta.action).toBe('service');
    expect(customCta.buyLabel).toBe('En savoir plus');
    expect(getMarketplaceProductCTA('course').buyLabel).toBe("S'inscrire");
  });
});
