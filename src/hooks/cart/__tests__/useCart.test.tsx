import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCart } from '../useCart';
import { supabase } from '@/integrations/supabase/client';
import * as cartData from '@/lib/cart/cart-data';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('@/lib/cart/cart-data', () => ({
  fetchCartItems: vi.fn(),
  fetchProductForCart: vi.fn(),
  findExistingCartLine: vi.fn(),
  updateCartItemQuantity: vi.fn(),
  insertCartItem: vi.fn(),
  patchCartItem: vi.fn(),
  deleteCartItemById: vi.fn(),
  clearCartItems: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useCart', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    vi.mocked(cartData.fetchCartItems).mockResolvedValue([]);
    vi.mocked(cartData.findExistingCartLine).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Cart Fetching', () => {
    it('should fetch cart items for anonymous user', async () => {
      vi.mocked(cartData.fetchCartItems).mockResolvedValue([
        {
          id: 'item1',
          user_id: null,
          session_id: 'session_123',
          product_id: 'prod1',
          product_type: 'digital',
          product_name: 'Test Product',
          product_image_url: null,
          variant_id: null,
          variant_name: null,
          quantity: 2,
          unit_price: 1000,
          discount_amount: 0,
          coupon_code: null,
          metadata: null,
          currency: 'XOF',
          added_at: '',
          updated_at: '',
        },
      ]);

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product_name).toBe('Test Product');
      expect(cartData.fetchCartItems).toHaveBeenCalled();
    });

    it('should calculate summary correctly', async () => {
      vi.mocked(cartData.fetchCartItems).mockResolvedValue([
        {
          id: 'item1',
          product_id: 'prod1',
          product_type: 'digital',
          product_name: 'Product 1',
          product_image_url: null,
          user_id: null,
          session_id: 's1',
          variant_id: null,
          variant_name: null,
          quantity: 2,
          unit_price: 1000,
          discount_amount: 100,
          coupon_code: null,
          metadata: null,
          currency: 'XOF',
          added_at: '',
          updated_at: '',
        },
      ]);

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary.subtotal).toBe(1800);
      expect(result.current.summary.discount_amount).toBe(200);
      expect(result.current.summary.item_count).toBe(1);
    });

    it('should handle empty cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.isEmpty).toBe(true);
      expect(result.current.itemCount).toBe(0);
    });
  });

  describe('Add Item', () => {
    it('should add new item to cart', async () => {
      vi.mocked(cartData.fetchProductForCart).mockResolvedValue({
        id: 'prod1',
        name: 'Test Product',
        image_url: null,
        price: 1000,
        currency: 'XOF',
        promotional_price: null,
        product_type: 'digital',
        store_id: 'store-1',
      });
      vi.mocked(cartData.insertCartItem).mockResolvedValue({
        id: 'new-item',
        product_id: 'prod1',
        product_name: 'Test Product',
        product_type: 'digital',
        product_image_url: null,
        user_id: null,
        session_id: 'session_x',
        variant_id: null,
        variant_name: null,
        quantity: 1,
        unit_price: 1000,
        discount_amount: 0,
        coupon_code: null,
        metadata: null,
        currency: 'XOF',
        added_at: '',
        updated_at: '',
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await result.current.addItem({
        product_id: 'prod1',
        product_type: 'digital',
        quantity: 1,
      });

      expect(cartData.insertCartItem).toHaveBeenCalled();
    });

    it('should update quantity if item already exists', async () => {
      vi.mocked(cartData.fetchProductForCart).mockResolvedValue({
        id: 'prod1',
        name: 'Test Product',
        image_url: null,
        price: 1000,
        currency: 'XOF',
        promotional_price: null,
        product_type: 'digital',
        store_id: 'store-1',
      });
      vi.mocked(cartData.findExistingCartLine).mockResolvedValue({
        id: 'item1',
        product_id: 'prod1',
        product_type: 'digital',
        product_name: 'Test Product',
        product_image_url: null,
        user_id: null,
        session_id: 's1',
        variant_id: null,
        variant_name: null,
        quantity: 1,
        unit_price: 1000,
        discount_amount: 0,
        coupon_code: null,
        metadata: null,
        currency: 'XOF',
        added_at: '',
        updated_at: '',
      });
      vi.mocked(cartData.updateCartItemQuantity).mockResolvedValue({
        id: 'item1',
        product_id: 'prod1',
        product_type: 'digital',
        product_name: 'Test Product',
        product_image_url: null,
        user_id: null,
        session_id: 's1',
        variant_id: null,
        variant_name: null,
        quantity: 2,
        unit_price: 1000,
        discount_amount: 0,
        coupon_code: null,
        metadata: null,
        currency: 'XOF',
        added_at: '',
        updated_at: '',
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await result.current.addItem({
        product_id: 'prod1',
        product_type: 'digital',
        quantity: 1,
      });

      expect(cartData.updateCartItemQuantity).toHaveBeenCalledWith('item1', 2);
    });
  });

  describe('Update Item', () => {
    it('should update item quantity', async () => {
      vi.mocked(cartData.fetchCartItems).mockResolvedValue([
        {
          id: 'item1',
          product_id: 'prod1',
          product_type: 'digital',
          product_name: 'P',
          product_image_url: null,
          user_id: null,
          session_id: 's1',
          variant_id: null,
          variant_name: null,
          quantity: 1,
          unit_price: 1000,
          discount_amount: 0,
          coupon_code: null,
          metadata: null,
          currency: 'XOF',
          added_at: '',
          updated_at: '',
        },
      ]);
      vi.mocked(cartData.patchCartItem).mockResolvedValue({
        id: 'item1',
        product_id: 'prod1',
        product_type: 'digital',
        product_name: 'P',
        product_image_url: null,
        user_id: null,
        session_id: 's1',
        variant_id: null,
        variant_name: null,
        quantity: 3,
        unit_price: 1000,
        discount_amount: 0,
        coupon_code: null,
        metadata: null,
        currency: 'XOF',
        added_at: '',
        updated_at: '',
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await result.current.updateItem({ item_id: 'item1', quantity: 3 });

      expect(cartData.patchCartItem).toHaveBeenCalledWith('item1', { quantity: 3 });
    });
  });

  describe('Remove Item', () => {
    it('should remove item from cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await result.current.removeItem('item1');

      expect(cartData.deleteCartItemById).toHaveBeenCalledWith('item1');
    });
  });

  describe('Clear Cart', () => {
    it('should clear all items from cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await result.current.clearCart();

      expect(cartData.clearCartItems).toHaveBeenCalled();
    });
  });
});
