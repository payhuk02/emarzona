import { describe, expect, it } from 'vitest';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';

describe('parsePhysicalCheckoutOptions', () => {
  it('defaults to online payment and Commander label', () => {
    const parsed = parsePhysicalCheckoutOptions(null);
    expect(parsed.checkout_method).toBe('online');
    expect(parsed.cta_button_label).toBe('Commander');
    expect(parsed.checkout_method_label).toBe('Paiement en ligne');
  });

  it('parses cash on delivery and custom button', () => {
    const parsed = parsePhysicalCheckoutOptions({
      checkout_method: 'cash_on_delivery',
      cta_button_label: 'Payer à la livraison',
      payment_type: 'full',
      percentage_rate: 30,
    });
    expect(parsed.checkout_method).toBe('cash_on_delivery');
    expect(parsed.cta_button_label).toBe('Payer à la livraison');
    expect(parsed.checkout_method_label).toBe('Paiement à la livraison');
  });
});
