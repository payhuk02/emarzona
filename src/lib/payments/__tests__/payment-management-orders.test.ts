import { describe, expect, it } from 'vitest';
import {
  advancedPaymentFromOrder,
  getManagementPaymentKind,
  getManagementStatusKind,
  orderNeedsAdvancedManagement,
  syntheticPaymentIdForOrder,
} from '@/lib/payments/payment-management-orders';

describe('payment-management-orders', () => {
  it('excludes full payment orders stuck at pending with no balance', () => {
    expect(
      orderNeedsAdvancedManagement({
        id: '1',
        payment_type: 'full',
        payment_status: 'pending',
        remaining_amount: 0,
      })
    ).toBe(false);
  });

  it('includes delivery_secured orders awaiting confirmation', () => {
    expect(
      orderNeedsAdvancedManagement({
        id: '2',
        payment_type: 'delivery_secured',
        payment_status: 'pending',
        remaining_amount: 0,
        delivery_status: 'pending',
      })
    ).toBe(true);
  });

  it('does not mark escrow pending as completed', () => {
    const order = {
      id: '3',
      payment_type: 'delivery_secured' as const,
      payment_status: 'pending',
      remaining_amount: 0,
      delivery_status: 'pending',
    };
    expect(getManagementPaymentKind(order)).toBe('escrow');
    expect(getManagementStatusKind(order)).toBe('pending');
  });

  it('marks settled escrow with confirmed delivery as completed', () => {
    const order = {
      id: '4',
      payment_type: 'delivery_secured' as const,
      payment_status: 'paid',
      remaining_amount: 0,
      delivery_status: 'confirmed',
    };
    expect(getManagementStatusKind(order)).toBe('completed');
  });

  it('builds synthetic payment from order', () => {
    const payment = advancedPaymentFromOrder({
      id: 'ord-1',
      store_id: 'store-1',
      payment_type: 'delivery_secured',
      payment_status: 'pending',
      total_amount: 5200,
      currency: 'XOF',
      order_number: 'ORD-001',
    });
    expect(payment.id).toBe(syntheticPaymentIdForOrder('ord-1'));
    expect(payment.payment_type).toBe('delivery_secured');
    expect(payment.amount).toBe(5200);
  });
});
