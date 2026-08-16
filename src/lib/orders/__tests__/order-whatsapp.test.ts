import { describe, expect, it } from 'vitest';
import type { Order } from '@/hooks/useOrders';
import {
  buildOrderWhatsAppMessage,
  resolveOrderCustomerName,
  resolveOrderCustomerPhone,
} from '@/lib/orders/order-whatsapp';

const baseOrder: Order = {
  id: 'order-1',
  store_id: 'store-1',
  customer_id: 'cust-1',
  order_number: 'ORD-202608100001',
  total_amount: 5200,
  currency: 'XOF',
  status: 'pending',
  payment_status: 'pending',
  payment_method: null,
  notes: null,
  created_at: '2026-08-10T12:00:00.000Z',
  updated_at: '2026-08-10T12:00:00.000Z',
  customers: {
    name: 'Tud Emarzona',
    email: 'tud@example.com',
    phone: '+226 70 00 00 00',
  },
};

describe('order-whatsapp', () => {
  it('resolveOrderCustomerPhone prefers customer phone then shipping phone', () => {
    expect(resolveOrderCustomerPhone(baseOrder)).toBe('+226 70 00 00 00');
    expect(
      resolveOrderCustomerPhone({
        ...baseOrder,
        customers: { name: 'A', email: null, phone: null },
        shipping_address: { phone: '22670123456' },
      })
    ).toBe('22670123456');
  });

  it('resolveOrderCustomerName falls back to shipping full name', () => {
    expect(resolveOrderCustomerName(baseOrder)).toBe('Tud Emarzona');
    expect(
      resolveOrderCustomerName({
        ...baseOrder,
        customers: null,
        shipping_address: { full_name: 'Jean Dupont' },
      })
    ).toBe('Jean Dupont');
  });

  it('buildOrderWhatsAppMessage includes order, products and payment status', () => {
    const message = buildOrderWhatsAppMessage(
      baseOrder,
      [
        {
          product_name: 'Cours Excel',
          quantity: 1,
          unit_price: 5200,
          total_price: 5200,
        },
      ],
      { storeName: 'Ma Boutique' }
    );

    expect(message).toContain('Bonjour Tud Emarzona,');
    expect(message).toContain('*ORD-202608100001*');
    expect(message).toContain('Cours Excel (x1)');
    expect(message).toContain('*Montant total :* 5 200,00 XOF');
    expect(message).toContain('*Statut du paiement :* En attente');
    expect(message).toContain('finaliser votre paiement');
    expect(message).toContain('Ma Boutique');
  });
});
