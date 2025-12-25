/**
 * Tests unitaires pour useAffiliates
 * Date : Janvier 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAffiliates } from '../useAffiliates';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useAffiliates', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    vi.clearAllMocks();
  });

  it('should fetch affiliates with pagination', async () => {
    const mockAffiliates = [
      { id: '1', email: 'test@example.com', affiliate_code: 'TEST001' },
      { id: '2', email: 'test2@example.com', affiliate_code: 'TEST002' },
    ];

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    };

    (supabase.from as any).mockReturnValue(mockQuery);
    mockQuery.select.mockResolvedValue({
      data: mockAffiliates,
      error: null,
    });

    // Mock count query
    const mockCountQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValueOnce(mockCountQuery);
    mockCountQuery.select.mockResolvedValue({
      count: 2,
      error: null,
    });

    const { result } = renderHook(() => useAffiliates(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.affiliates).toHaveLength(2);
    expect(result.current.pagination.total).toBe(2);
  });

  it('should handle errors gracefully', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };

    (supabase.from as any).mockReturnValue(mockQuery);
    mockQuery.select.mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'PGRST301' },
    });

    // Mock count query
    const mockCountQuery = {
      select: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValueOnce(mockCountQuery);
    mockCountQuery.select.mockResolvedValue({
      count: 0,
      error: null,
    });

    const { result } = renderHook(() => useAffiliates(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.affiliates).toHaveLength(0);
  });

  it('should register affiliate successfully', async () => {
    const mockAffiliate = {
      id: '1',
      email: 'new@example.com',
      affiliate_code: 'NEW001',
    };

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user123' } },
    });

    (supabase.rpc as any).mockResolvedValue({
      data: 'NEW001',
      error: null,
    });

    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockAffiliate,
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const { result } = renderHook(() => useAffiliates(), { wrapper });

    const formData = {
      email: 'new@example.com',
      first_name: 'John',
      last_name: 'Doe',
    };

    const registered = await result.current.registerAffiliate(formData);

    expect(registered).not.toBeNull();
    expect(registered?.affiliate_code).toBe('NEW001');
  });
});

