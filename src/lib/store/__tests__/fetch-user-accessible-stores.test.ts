import { describe, expect, it, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fromMock },
}));

import {
  fetchActiveMemberStoreIds,
  fetchUserAccessibleStores,
} from '@/lib/store/fetch-user-accessible-stores';

describe('fetchUserAccessibleStores', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('filtre owner seul si aucun membre', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 's1',
          user_id: 'u1',
          name: 'Mine',
          slug: 'mine',
          metadata: null,
          commerce_type: 'digital',
          store_appearance: { logo_url: 'https://cdn/logo.png' },
        },
      ],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ order });
    const selectStores = vi.fn().mockReturnValue({ eq, or: vi.fn() });

    const selectMembers = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'store_members') return { select: selectMembers };
      return { select: selectStores };
    });

    const stores = await fetchUserAccessibleStores('u1');
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(stores).toHaveLength(1);
    expect(stores[0]).toMatchObject({ id: 's1', logo_url: 'https://cdn/logo.png' });
  });

  it('inclut owner + ids membres via or()', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const or = vi.fn().mockReturnValue({ order });
    const selectStores = vi.fn().mockReturnValue({ eq: vi.fn(), or });

    const selectMembers = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ store_id: 'm1' }, { store_id: 'm2' }],
          error: null,
        }),
      }),
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'store_members') return { select: selectMembers };
      return { select: selectStores };
    });

    await fetchUserAccessibleStores('u1');
    expect(or).toHaveBeenCalledWith('user_id.eq.u1,id.in.(m1,m2)');
  });

  it('fetchActiveMemberStoreIds retourne les ids', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ store_id: 'a' }, { store_id: 'b' }],
            error: null,
          }),
        }),
      }),
    });

    await expect(fetchActiveMemberStoreIds('u1')).resolves.toEqual(['a', 'b']);
  });
});
