import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePayments } from '../usePayments';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
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

describe('usePayments', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockQuery: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;
  let mockOr: ReturnType<typeof vi.fn>;
  let mockIlike: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOr = vi.fn().mockReturnThis();
    mockIlike = vi.fn().mockReturnThis();
    mockEq = vi.fn().mockReturnThis();
    mockOrder = vi.fn().mockReturnThis();
    mockSelect = vi.fn().mockReturnThis();

    mockQuery = {
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      or: mockOr,
      ilike: mockIlike,
    };

    mockFrom = vi.fn().mockReturnValue(mockQuery);
    (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Fetching', () => {
    it('should not fetch payments when storeId is not provided', async () => {
      const { result } = renderHook(() => usePayments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(0);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fetch payments for a store', async () => {
      const mockPayments = [
        {
          id: 'pay1',
          store_id: 'store1',
          order_id: 'order1',
          customer_id: 'customer1',
          payment_method: 'moneroo',
          amount: 10000,
          currency: 'XOF',
          status: 'completed',
          transaction_id: 'tx123',
          notes: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockPayments,
        error: null,
      });

      const { result } = renderHook(() => usePayments('store1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(1);
      expect(result.current.payments[0].payment_method).toBe('moneroo');
      expect(mockFrom).toHaveBeenCalledWith('payments');
    });

    it('should filter payments by status', async () => {
      const mockPayments = [
        {
          id: 'pay1',
          store_id: 'store1',
          status: 'completed',
          amount: 10000,
          payment_method: 'moneroo',
          currency: 'XOF',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockPayments,
        error: null,
      });

      const { result } = renderHook(() => usePayments('store1', undefined, 'completed'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(1);
      expect(result.current.payments[0].status).toBe('completed');
    });

    it('should filter payments by payment method', async () => {
      const mockPayments = [
        {
          id: 'pay1',
          store_id: 'store1',
          status: 'completed',
          payment_method: 'moneroo',
          amount: 10000,
          currency: 'XOF',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockPayments,
        error: null,
      });

      const { result } = renderHook(() => usePayments('store1', undefined, undefined, 'moneroo'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(1);
      expect(result.current.payments[0].payment_method).toBe('moneroo');
    });

    it('should search payments by transaction_id or notes', async () => {
      const mockPayments = [
        {
          id: 'pay1',
          store_id: 'store1',
          transaction_id: 'tx123',
          notes: 'Test payment',
          payment_method: 'moneroo',
          amount: 10000,
          currency: 'XOF',
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockPayments,
        error: null,
      });

      const { result } = renderHook(() => usePayments('store1', 'tx123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => usePayments('store1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(0);
    });

    it('should handle empty payment list', async () => {
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => usePayments('store1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payments).toHaveLength(0);
    });
  });
});
