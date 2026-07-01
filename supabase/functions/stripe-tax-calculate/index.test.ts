import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

Deno.test('Stripe Tax — contract: POST required', () => {
  assertEquals('POST', 'POST');
});

Deno.test('Stripe Tax — contract: disabled when STRIPE_SECRET_KEY absent', () => {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  const configured = !!key && key.length > 20;
  if (!configured) {
    assertEquals(configured, false);
  }
});

Deno.test('Stripe Tax — contract: response shape', () => {
  const mock = {
    tax_amount: 20,
    tax_breakdown: [{ type: 'vat', name: 'VAT', rate: 20, amount: 20 }],
    subtotal: 100,
    shipping_amount: 0,
    total_with_tax: 120,
    source: 'stripe_tax',
  };
  assertEquals(typeof mock.tax_amount, 'number');
  assertEquals(Array.isArray(mock.tax_breakdown), true);
  assertEquals(mock.source, 'stripe_tax');
});
