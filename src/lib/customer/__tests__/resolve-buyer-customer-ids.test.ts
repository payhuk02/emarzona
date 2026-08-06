import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getBuyerOrderCustomerIds,
  resolveBuyerCustomerIds,
} from '@/lib/customer/resolve-buyer-customer-ids';

const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

function mockCustomersQuery(rows: { id: string }[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return chain;
}

describe('resolveBuyerCustomerIds', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('includes user_id matches, email matches, and legacy uid', async () => {
    const byUser = mockCustomersQuery([{ id: 'cust-1' }]);
    const byEmail = mockCustomersQuery([{ id: 'cust-2' }, { id: 'cust-1' }]);
    fromMock.mockReturnValueOnce(byUser).mockReturnValueOnce(byEmail);

    const ids = await resolveBuyerCustomerIds({
      userId: 'auth-uid',
      email: 'Buyer@Example.com',
    });

    expect(ids).toEqual(expect.arrayContaining(['auth-uid', 'cust-1', 'cust-2']));
    expect(byEmail.eq).toHaveBeenCalledWith('email', 'buyer@example.com');
  });

  it('returns only legacy uid when no customer rows', async () => {
    fromMock.mockReturnValue(mockCustomersQuery([]));

    const ids = await resolveBuyerCustomerIds({ userId: 'auth-uid' });
    expect(ids).toEqual(['auth-uid']);
  });
});

describe('getBuyerOrderCustomerIds', () => {
  it('excludes legacy uid when linked customer profiles exist', () => {
    expect(getBuyerOrderCustomerIds(['auth-uid', 'cust-1', 'cust-2'], 'auth-uid')).toEqual([
      'cust-1',
      'cust-2',
    ]);
  });

  it('keeps legacy uid when no linked profiles exist', () => {
    expect(getBuyerOrderCustomerIds(['auth-uid'], 'auth-uid')).toEqual(['auth-uid']);
  });
});
