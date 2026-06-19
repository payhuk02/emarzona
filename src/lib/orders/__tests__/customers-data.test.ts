import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';

describe('customers-data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing customer id and updates address when provided', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'cust-1' }, error: null });
    const eqEmail = vi.fn().mockReturnValue({ maybeSingle });
    const eqStore = vi.fn().mockReturnValue({ eq: eqEmail });
    const select = vi.fn().mockReturnValue({ eq: eqStore });

    const client = {
      from: vi.fn().mockReturnValue({ select, update }),
    };

    const id = await findOrCreateStoreCustomer(
      {
        storeId: 'store-1',
        email: 'buyer@example.com',
        address: '1 rue Test',
        city: 'Abidjan',
      },
      client as never
    );

    expect(id).toBe('cust-1');
    expect(update).toHaveBeenCalled();
  });

  it('creates a new customer when none exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqEmail = vi.fn().mockReturnValue({ maybeSingle });
    const eqStore = vi.fn().mockReturnValue({ eq: eqEmail });
    const select = vi.fn().mockReturnValue({ eq: eqStore });
    const single = vi.fn().mockResolvedValue({ data: { id: 'cust-new' }, error: null });
    const insertSelect = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: insertSelect });

    const client = {
      from: vi.fn((table: string) => {
        if (table === 'customers') {
          return { select, insert };
        }
        return { select };
      }),
    };

    const id = await findOrCreateStoreCustomer(
      { storeId: 'store-1', email: 'new@example.com', name: 'Buyer' },
      client as never
    );

    expect(id).toBe('cust-new');
    expect(insert).toHaveBeenCalled();
  });
});
