import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import {
  assertPhysicalStockAvailable,
  checkPhysicalStockAvailability,
  PhysicalStockError,
} from '@/lib/cart/physical-stock-validation';

describe('physical-stock-validation', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset();
  });

  it('checkPhysicalStockAvailability retourne le résultat RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { available: true, available_quantity: 5 },
      error: null,
    });

    const result = await checkPhysicalStockAvailability('prod-1', 2, 'variant-1');

    expect(supabase.rpc).toHaveBeenCalledWith('check_physical_stock_availability', {
      p_product_id: 'prod-1',
      p_variant_id: 'variant-1',
      p_quantity: 2,
    });
    expect(result.available).toBe(true);
    expect(result.availableQuantity).toBe(5);
  });

  it('assertPhysicalStockAvailable lève PhysicalStockError si rupture', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { available: false, available_quantity: 0, reason: 'insufficient_stock' },
      error: null,
    });

    await expect(assertPhysicalStockAvailable('prod-1', 3)).rejects.toBeInstanceOf(
      PhysicalStockError
    );
  });

  it('assertPhysicalStockAvailable indique la quantité restante', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { available: false, available_quantity: 2, reason: 'insufficient_stock' },
      error: null,
    });

    await expect(assertPhysicalStockAvailable('prod-1', 5)).rejects.toMatchObject({
      message: 'Stock insuffisant : seulement 2 disponible(s)',
      availableQuantity: 2,
    });
  });
});
