import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, fromMock, singleMock } = vi.hoisted(() => {
  const singleMock = vi.fn();
  const fromMock = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: singleMock,
      })),
    })),
  }));
  const rpcMock = vi.fn();
  return { rpcMock, fromMock, singleMock };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

import {
  assertUserCanManageProduct,
  userCanManageProduct,
  userCanManageStoreProducts,
} from '@/lib/products/can-manage-product';

describe('can-manage-product', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('userCanManageStoreProducts returns true when RPC allows', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null });
    await expect(userCanManageStoreProducts('store-1', 'user-1')).resolves.toBe(true);
    expect(rpcMock).toHaveBeenCalledWith('has_store_permission', {
      _store_id: 'store-1',
      _user_id: 'user-1',
      _permission: 'products.manage',
    });
  });

  it('assertUserCanManageProduct throws when permission denied', async () => {
    singleMock.mockResolvedValue({
      data: { id: 'prod-1', store_id: 'store-1' },
      error: null,
    });
    rpcMock.mockResolvedValue({ data: false, error: null });

    await expect(assertUserCanManageProduct('prod-1', 'user-1')).rejects.toThrow(
      /permissions pour modifier/
    );
  });

  it('userCanManageProduct returns false instead of throwing', async () => {
    singleMock.mockResolvedValue({ data: null, error: { message: 'not found' } });
    await expect(userCanManageProduct('missing', 'user-1')).resolves.toBe(false);
  });
});
