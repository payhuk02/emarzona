/**
 * E2E — Checkout direct mono-produit (contrat URL)
 */
import { test, expect } from '@playwright/test';
import { buildCheckoutUrl, resolveCheckoutMode } from '../../src/lib/checkout/checkout-route';

test.describe('Direct checkout route', () => {
  test('requires productId for buy_now mode', () => {
    expect(resolveCheckoutMode(new URLSearchParams())).toBe('invalid');
    expect(resolveCheckoutMode(new URLSearchParams({ productId: 'p1', storeId: 's1' }))).toBe(
      'buy_now'
    );
  });

  test('buildCheckoutUrl encodes quantity and service slot', () => {
    const url = buildCheckoutUrl({
      productId: 'p1',
      storeId: 's1',
      quantity: 3,
      scheduledAt: '2026-07-21T10:00:00.000Z',
    });
    expect(url).toContain('productId=p1');
    expect(url).toContain('storeId=s1');
    expect(url).toContain('quantity=3');
    expect(url).toContain('scheduledAt=');
  });
});
