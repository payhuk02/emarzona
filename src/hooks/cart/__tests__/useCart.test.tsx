import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCart } from '../useCart';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useCart', () => {
  let  queryClient: QueryClient;
  let  mockFrom: ReturnType<typeof vi.fn>;
  let  mockQuery: ReturnType<typeof vi.fn>;
  let  mockSelect: ReturnType<typeof vi.fn>;
  let  mockEq: ReturnType<typeof vi.fn>;
  let  mockOrder: ReturnType<typeof vi.fn>;
  let  mockInsert: ReturnType<typeof vi.fn>;
  let  mockUpdate: ReturnType<typeof vi.fn>;
  let  mockDelete: ReturnType<typeof vi.fn>;
  let  mockSingle: ReturnType<typeof vi.fn>;
  let  mockIs: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    // Setup mock chain
    mockSingle = vi.fn();
    mockIs = vi.fn().mockReturnThis();
    mockEq = vi.fn().mockReturnThis();
    mockOrder = vi.fn().mockReturnThis();
    mockSelect = vi.fn().mockReturnThis();
    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: mockSingle,
    });
    mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: mockSingle,
    });
    mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn(),
    });

    mockQuery = {
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      order: mockOrder,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    };

    mockFrom = vi.fn().mockReturnValue(mockQuery);
    (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Mock auth.getUser
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Cart Fetching', () => {
    it('should fetch cart items for anonymous user', async () => {
      const mockCartItems = [
        {
          id: 'item1',
          user_id: null,
          session_id: 'session_123',
          product_id: 'prod1',
          product_name: 'Test Product',
          quantity: 2,
          unit_price: 1000,
          currency: 'XOF',
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockCartItems,
        error: null,
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product_name).toBe('Test Product');
    });

    it('should calculate summary correctly', async () => {
      const mockCartItems = [
        {
          id: 'item1',
          product_id: 'prod1',
          product_name: 'Product 1',
          quantity: 2,
          unit_price: 1000,
          discount_amount: 100,
          currency: 'XOF',
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockCartItems,
        error: null,
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary.subtotal).toBe(1800); // (1000 - 100) * 2
      expect(result.current.summary.discount_amount).toBe(200); // 100 * 2
      expect(result.current.summary.item_count).toBe(1);
    });

    it('should handle empty cart', async () => {
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

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
      // Mock empty cart
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock product fetch
      const productQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'prod1',
            name: 'Test Product',
            price: 1000,
            currency: 'XOF',
            promotional_price: null,
            product_type: 'digital',
          },
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(productQuery);

      // Mock existing items check (empty)
      const existingItemsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(existingItemsQuery);

      // Mock insert
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'new-item',
          product_id: 'prod1',
          product_name: 'Test Product',
          quantity: 1,
          unit_price: 1000,
          currency: 'XOF',
        },
        error: null,
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.addItem({
        product_id: 'prod1',
        product_type: 'digital',
        quantity: 1,
      });

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });

    it('should update quantity if item already exists', async () => {
      const existingItem = {
        id: 'item1',
        product_id: 'prod1',
        quantity: 1,
      };

      // Mock cart with existing item
      mockOrder.mockResolvedValue({
        data: [existingItem],
        error: null,
      });

      // Mock product fetch
      const productQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'prod1',
            name: 'Test Product',
            price: 1000,
            currency: 'XOF',
          },
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(productQuery);

      // Mock existing items check
      const existingItemsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [existingItem],
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(existingItemsQuery);

      // Mock update
      const updateSingle = vi.fn().mockResolvedValue({
        data: {
          ...existingItem,
          quantity: 2,
        },
        error: null,
      });
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: updateSingle,
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.addItem({
        product_id: 'prod1',
        product_type: 'digital',
        quantity: 1,
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Update Item', () => {
    it('should update item quantity', async () => {
      const item = {
        id: 'item1',
        product_id: 'prod1',
        quantity: 1,
        unit_price: 1000,
      };

      mockOrder.mockResolvedValue({
        data: [item],
        error: null,
      });

      const updateSingle = vi.fn().mockResolvedValue({
        data: { ...item, quantity: 3 },
        error: null,
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.updateItem({
        item_id: 'item1',
        quantity: 3,
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Remove Item', () => {
    it('should remove item from cart', async () => {
      const item = {
        id: 'item1',
        product_id: 'prod1',
        quantity: 1,
      };

      mockOrder.mockResolvedValue({
        data: [item],
        error: null,
      });

      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.removeItem('item1');

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
      });
    });
  });

  describe('Clear Cart', () => {
    it('should clear all items from cart', async () => {
      mockOrder.mockResolvedValue({
        data: [
          { id: 'item1', product_id: 'prod1' },
          { id: 'item2', product_id: 'prod2' },
        ],
        error: null,
      });

      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.clearCart();

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
      });
    });
  });
});







