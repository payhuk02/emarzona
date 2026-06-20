import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchCartItems,
  fetchProductForCart,
  findExistingCartLine,
  clearCartItems,
  updateCartItemQuantity,
  insertCartItem,
  patchCartItem,
  deleteCartItemById,
  CART_ITEM_FIELDS,
} from '@/lib/cart/cart-data';

function createMockClient() {
  const mockSingle = vi.fn();
  const mockIs = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();

  const chain = {
    select: mockSelect,
    eq: mockEq,
    is: mockIs,
    order: mockOrder,
    single: mockSingle,
    delete: mockDelete,
    update: mockUpdate,
    insert: mockInsert,
  };

  mockSelect.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockIs.mockReturnValue(chain);
  mockOrder.mockReturnValue(chain);
  mockDelete.mockReturnValue(chain);
  mockUpdate.mockReturnValue(chain);
  mockInsert.mockReturnValue(chain);

  const client = {
    from: vi.fn(() => chain),
  };

  return {
    client,
    mockOrder,
    mockEq,
    mockSingle,
    mockDelete,
    mockUpdate,
    mockInsert,
    mockSelect,
    chain,
  };
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

  it('fetchProductForCart returns product snapshot', async () => {
    const { client, mockSingle } = createMockClient();
    const product = {
      id: 'prod-1',
      name: 'Test',
      image_url: null,
      price: 10,
      currency: 'EUR',
      promotional_price: null,
      product_type: 'physical',
      store_id: 'store-1',
    };
    mockSingle.mockResolvedValue({ data: product, error: null });

    const result = await fetchProductForCart('prod-1', client as never);
    expect(result).toEqual(product);
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

  it('findExistingCartLine scopes by variant_id when provided', async () => {
    const { client, chain } = createMockClient();
    const item = { id: 'line-1', product_id: 'prod-1', quantity: 1 };
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.is = vi.fn();
    chain.eq.mockImplementation((col: string) => {
      if (col === 'variant_id') {
        return Promise.resolve({ data: [item], error: null });
      }
      return chain;
    });

    const result = await findExistingCartLine({ userId: 'u1' }, 'prod-1', 'var-1', client as never);
    expect(result).toEqual(item);
  });

  it('clearCartItems deletes scoped by user_id', async () => {
    const { client, mockEq, mockDelete } = createMockClient();
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });

    await clearCartItems({ userId: 'user-1' }, client as never);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('clearCartItems deletes scoped by session_id', async () => {
    const { client, mockEq, mockDelete } = createMockClient();
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });

    await clearCartItems({ sessionId: 'sess-1' }, client as never);

    expect(mockEq).toHaveBeenCalledWith('session_id', 'sess-1');
  });

  it('updateCartItemQuantity updates quantity', async () => {
    const { client, mockUpdate, mockEq, mockSelect, mockSingle } = createMockClient();
    const updated = { id: 'item-1', quantity: 3 };
    mockSingle.mockResolvedValue({ data: updated, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const result = await updateCartItemQuantity('item-1', 3, client as never);
    expect(result).toEqual(updated);
    expect(mockUpdate).toHaveBeenCalledWith({ quantity: 3 });
  });

  it('insertCartItem inserts and returns row', async () => {
    const { client, mockInsert, mockSelect, mockSingle } = createMockClient();
    const row = { id: 'new-1', product_id: 'p1', quantity: 1 };
    mockSingle.mockResolvedValue({ data: row, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const result = await insertCartItem(
      { product_id: 'p1', quantity: 1, unit_price: 10 } as never,
      client as never
    );
    expect(result).toEqual(row);
  });

  it('patchCartItem patches fields', async () => {
    const { client, mockUpdate, mockEq, mockSelect, mockSingle } = createMockClient();
    const row = { id: 'item-1', quantity: 2 };
    mockSingle.mockResolvedValue({ data: row, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const result = await patchCartItem('item-1', { quantity: 2 }, client as never);
    expect(result).toEqual(row);
  });

  it('deleteCartItemById deletes by id', async () => {
    const { client, mockDelete, mockEq } = createMockClient();
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });

    await deleteCartItemById('item-1', client as never);
    expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
  });
});
