import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CartItem } from '@/types/cart';

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import {
  reserveArtistLimitedEdition,
  reserveArtistLimitedEditionsForCart,
} from '@/lib/artist-edition-reservation';

function mockArtistProductRow(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        artwork_edition_type: 'limited_edition',
        total_editions: 10,
        ...overrides,
      },
      error: null,
    }),
  };
  fromMock.mockReturnValue(chain);
  return chain;
}

describe('artist-edition-reservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skip RPC when not limited edition', async () => {
    mockArtistProductRow({ artwork_edition_type: 'original', total_editions: null });

    await reserveArtistLimitedEdition('product-1', 1);

    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('calls RPC for limited edition', async () => {
    mockArtistProductRow();
    rpcMock.mockResolvedValue({
      data: [{ success: true, current_version: 2, available_editions: 9 }],
      error: null,
    });

    await reserveArtistLimitedEdition('product-1', 1);

    expect(rpcMock).toHaveBeenCalledWith('check_and_increment_artist_product_version', {
      p_product_id: 'product-1',
      p_expected_version: 0,
      p_quantity: 1,
    });
  });

  it('throws when RPC reports insufficient stock', async () => {
    mockArtistProductRow();
    rpcMock.mockResolvedValue({
      data: [{ success: false, available_editions: 0, message: 'Épuisé' }],
      error: null,
    });

    await expect(reserveArtistLimitedEdition('product-1', 1)).rejects.toThrow('Épuisé');
  });

  it('aggregates quantities per product in cart', async () => {
    const chain = mockArtistProductRow();
    rpcMock.mockResolvedValue({
      data: [{ success: true, current_version: 2, available_editions: 8 }],
      error: null,
    });

    const items: CartItem[] = [
      {
        product_id: 'p1',
        product_type: 'artist',
        product_name: 'Oeuvre',
        quantity: 2,
        unit_price: 1000,
        currency: 'XOF',
      },
      {
        product_id: 'p1',
        product_type: 'artist',
        product_name: 'Oeuvre',
        quantity: 1,
        unit_price: 1000,
        currency: 'XOF',
      },
      {
        product_id: 'p2',
        product_type: 'digital',
        product_name: 'Digital',
        quantity: 1,
        unit_price: 500,
        currency: 'XOF',
      },
    ];

    await reserveArtistLimitedEditionsForCart(items);

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(chain.eq).toHaveBeenCalledWith('product_id', 'p1');
    expect(rpcMock).toHaveBeenCalledWith(
      'check_and_increment_artist_product_version',
      expect.objectContaining({ p_product_id: 'p1', p_quantity: 3 })
    );
  });
});
