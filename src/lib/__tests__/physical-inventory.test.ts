import { describe, expect, it, vi } from 'vitest';
import type { CartItem } from '@/types/cart';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

import { cartHasPhysicalItems } from '@/lib/physical-inventory';

const physicalItem: CartItem = {
  product_id: 'p1',
  product_type: 'physical',
  product_name: 'T-shirt',
  quantity: 1,
  unit_price: 1000,
  currency: 'XOF',
};

describe('physical-inventory', () => {
  it('cartHasPhysicalItems détecte les articles physical', () => {
    expect(cartHasPhysicalItems([physicalItem])).toBe(true);
    expect(cartHasPhysicalItems([{ ...physicalItem, product_type: 'digital' }, physicalItem])).toBe(
      true
    );
    expect(cartHasPhysicalItems([{ ...physicalItem, product_type: 'digital' }])).toBe(false);
    expect(cartHasPhysicalItems([])).toBe(false);
  });
});
