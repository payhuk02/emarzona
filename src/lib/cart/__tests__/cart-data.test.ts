import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchCartItems,
  fetchProductForCart,
  findExistingCartLine,
  CART_ITEM_FIELDS,
} from '@/lib/cart/cart-data';

function createMockClient() {
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockIs = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();

  const chain = {
    select: mockSelect,
    eq: mockEq,
    is: mockIs,
    order: mockOrder,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };

  mockSelect.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockIs.mockReturnValue(chain);
  mockOrder.mockReturnValue(chain);

  const client = {
    from: vi.fn(() => chain),
  };

  return { client, mockOrder, mockEq, mockSingle, chain };
}

describe('cart-data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports cart item field projection', () => {
    expect(CART_ITEM_FIELDS).toContain('product_id');
    expect(CART_ITEM_FIELDS).toContain('quantity');
  });

  it('fetchCartItems scopes by user_id', async () => {
    const { client, mockEq, mockOrder } = createMockClient();
    mockEq.mockResolvedValue({ data: [], error: null });
    mockOrder.mockReturnValue({ eq: mockEq });

    await fetchCartItems({ userId: 'user-1' }, client as never);

    expect(client.from).toHaveBeenCalledWith('cart_items');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('fetchCartItems scopes by session_id for anonymous carts', async () => {
    const { client, mockEq, mockOrder } = createMockClient();
    mockEq.mockResolvedValue({ data: [], error: null });
    mockOrder.mockReturnValue({ eq: mockEq });

    await fetchCartItems({ sessionId: 'sess-abc' }, client as never);

    expect(mockEq).toHaveBeenCalledWith('session_id', 'sess-abc');
  });

  it('fetchProductForCart throws when product missing', async () => {
    const { client, mockSingle } = createMockClient();
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(fetchProductForCart('prod-1', client as never)).rejects.toThrow(
      'Produit non trouvé'
    );
  });

  it('findExistingCartLine returns null when no row', async () => {
    const { client, chain } = createMockClient();
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.is = vi.fn().mockResolvedValue({ data: [], error: null });

    const result = await findExistingCartLine({ userId: 'u1' }, 'prod-1', null, client as never);
    expect(result).toBeNull();
  });
});
