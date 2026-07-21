import { describe, expect, it } from 'vitest';
import { parsePhysicalCheckoutOptions } from '../physical-checkout-display';

describe('parsePhysicalCheckoutOptions', () => {
  it('defaults to online payment', () => {
    const parsed = parsePhysicalCheckoutOptions(null);
    expect(parsed.checkout_method).toBe('online');
    expect(parsed.cta_button_label).toBe('Commander');
  });

  it('parses cash on delivery with custom CTA', () => {
    const parsed = parsePhysicalCheckoutOptions({
      checkout_method: 'cash_on_delivery',
      cta_button_label: 'Payer à la livraison',
      payment_type: 'full',
    });
    expect(parsed.checkout_method).toBe('cash_on_delivery');
    expect(parsed.checkout_method_label).toMatch(/livraison/i);
    expect(parsed.cta_button_label).toBe('Payer à la livraison');
  });

  it('parses online payment with custom CTA', () => {
    const parsed = parsePhysicalCheckoutOptions({
      checkout_method: 'online',
      cta_button_label: 'Acheter en ligne',
    });
    expect(parsed.checkout_method).toBe('online');
    expect(parsed.cta_button_label).toBe('Acheter en ligne');
  });
});
