import { describe, expect, it } from 'vitest';
import { buildGuestOrderConfirmationPath } from '@/lib/physical/guest-order-confirmation';

describe('buildGuestOrderConfirmationPath', () => {
  it('builds public COD confirmation URL', () => {
    const path = buildGuestOrderConfirmationPath({
      orderId: 'abc-123',
      orderNumber: 'ORD-42',
      productName: 'T-shirt premium',
      customerEmail: 'buyer@example.com',
      cashOnDelivery: true,
    });

    expect(path).toContain('/orders/confirmed?');
    expect(path).toContain('orderId=abc-123');
    expect(path).toContain('orderNumber=ORD-42');
    expect(path).toContain('product=T-shirt');
    expect(path).toContain('email=buyer%40example.com');
    expect(path).toContain('cod=1');
  });
});
