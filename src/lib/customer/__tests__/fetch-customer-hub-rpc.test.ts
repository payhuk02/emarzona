import { describe, expect, it } from 'vitest';
import { parseCustomerHubRpcPayload } from '@/lib/customer/fetch-customer-hub-rpc';

describe('fetch-customer-hub-rpc', () => {
  it('parses hub RPC payload shape', () => {
    const summary = parseCustomerHubRpcPayload({
      recentOrders: [
        {
          id: 'o1',
          order_number: 'ORD-001',
          status: 'processing',
          payment_status: 'paid',
          created_at: '2026-07-17T10:00:00Z',
          items: [{ product_type: 'physical' }, { product_type: 'digital' }],
        },
      ],
      countsByType: {
        digital: 2,
        physical: 1,
        service: 0,
        course: 0,
        artist: 0,
      },
      activeOrdersCount: 1,
      generatedAt: '2026-07-17T12:00:00Z',
    });

    expect(summary.recentOrders).toHaveLength(1);
    expect(summary.recentOrders[0].items).toHaveLength(2);
    expect(summary.countsByType.physical).toBe(1);
    expect(summary.activeOrdersCount).toBe(1);
  });
});
