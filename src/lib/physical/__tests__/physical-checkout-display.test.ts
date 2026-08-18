import { describe, expect, it } from 'vitest';
import { parsePhysicalCheckoutOptions } from '../physical-checkout-display';
import {
  computePhysicalGuaranteeBreakdown,
  suggestedGuaranteeAmount,
  validateGuaranteeAmount,
} from '../physical-guarantee';

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

  it('parses guarantee deposit checkout', () => {
    const parsed = parsePhysicalCheckoutOptions({
      checkout_method: 'guarantee',
      cta_button_label: 'Payer la garantie',
      payment_type: 'full',
      percentage_rate: 30,
      guarantee_amount: 5000,
    });
    expect(parsed.checkout_method).toBe('guarantee');
    expect(parsed.checkout_method_label).toMatch(/garantie/i);
    expect(parsed.guarantee_amount).toBe(5000);
  });
});

describe('physical guarantee amounts', () => {
  it('computes per-item deposit and remainder', () => {
    const breakdown = computePhysicalGuaranteeBreakdown({
      unitPrice: 20000,
      quantity: 2,
      guaranteeAmount: 5000,
    });
    expect(breakdown.orderTotal).toBe(40000);
    expect(breakdown.guaranteeDueNow).toBe(10000);
    expect(breakdown.remainderOnDelivery).toBe(30000);
  });

  it('rejects guarantee >= price', () => {
    expect(validateGuaranteeAmount(20000, 20000)).not.toBeNull();
    expect(validateGuaranteeAmount(5000, 20000)).toBeNull();
  });

  it('suggests a deposit below the price', () => {
    const suggested = suggestedGuaranteeAmount(10000);
    expect(suggested).toBeGreaterThan(0);
    expect(suggested).toBeLessThan(10000);
  });
});
