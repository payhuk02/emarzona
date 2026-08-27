import { describe, expect, it } from 'vitest';
import { buildDeliveryPackageInsertRows } from '@/lib/services/service-delivery-commerce';

describe('buildDeliveryPackageInsertRows', () => {
  it('sets seller user_id so catalog packages satisfy the NOT NULL constraint', () => {
    const rows = buildDeliveryPackageInsertRows({
      serviceProductId: 'svc-1',
      productId: 'prod-1',
      storeId: 'store-1',
      userId: 'user-1',
      packages: [
        {
          name: 'Basic',
          tier: 'basic',
          price: 10000,
          delivery_days: 3,
          revisions: 1,
          features: ['A'],
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe('user-1');
    expect(rows[0].package_name).toBe('Basic');
    expect(rows[0].package_price).toBe(10000);
    expect(rows[0].package_kind).toBe('delivery_tier');
    expect(rows[0].total_sessions).toBe(1);
    expect(rows[0].sessions_count).toBe(1);
  });
});
