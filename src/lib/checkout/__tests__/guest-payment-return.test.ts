import { describe, expect, it } from 'vitest';
import {
  buildPaymentSuccessReturnUrl,
  resolveCustomerPortalPath,
} from '@/lib/checkout/guest-payment-return';

describe('guest-payment-return', () => {
  it('resolveCustomerPortalPath maps product types', () => {
    expect(resolveCustomerPortalPath('digital')).toBe('/account/digital');
    expect(resolveCustomerPortalPath('course')).toBe('/account/courses');
    expect(resolveCustomerPortalPath('artist')).toBe('/account/artist');
  });

  it('buildPaymentSuccessReturnUrl includes guest params', () => {
    const url = buildPaymentSuccessReturnUrl(
      {
        orderId: 'ord-1',
        guestEmail: 'buyer@example.com',
        productType: 'digital',
        guest: true,
      },
      'https://www.emarzona.com'
    );
    expect(url).toContain('order_id=ord-1');
    expect(url).toContain('guest=1');
    expect(url).toContain('email=buyer%40example.com');
    expect(url).toContain('product_type=digital');
  });
});
