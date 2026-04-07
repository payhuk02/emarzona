/**
 * Tests unitaires pour useAffiliateShortLinks
 * Date : Janvier 2026
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAffiliateShortLinks } from '../useAffiliateShortLinks';
import { supabase } from '@/integrations/supabase/client';
// import { AffiliateError } from '@/lib/affiliate-errors'; // Not used

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    })),
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
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock affiliate-errors
vi.mock('@/lib/affiliate-errors', () => ({
  handleSupabaseError: vi.fn((error) => error),
  AffiliateErrors: {
    linkNotFound: vi.fn(() => new Error('Link not found')),
    databaseError: vi.fn(() => new Error('Database error')),
  },
  AffiliateError: class extends Error {
    constructor(message: string, _code?: string) {
      super(message);
      this.name = 'AffiliateError';
    }
  },
}));

describe('useAffiliateShortLinks', () => {
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

  afterEach(() => {
    queryClient.clear();
  });

  describe('fetchShortLinks', () => {
    it('should return empty array when no affiliateLinkId provided', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }));

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useAffiliateShortLinks(), { wrapper });

      await waitFor(() => {
        expect(result.current.shortLinks).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should fetch short links successfully', async () => {
      const mockShortLinks = [
        {
          id: '1',
          short_code: 'ABC123',
          custom_alias: null,
          is_active: true,
          total_clicks: 10,
        },
        {
          id: '2',
          short_code: 'XYZ789',
          custom_alias: 'facebook',
          is_active: false,
          total_clicks: 25,
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockShortLinks,
        error: null,
      });

      const mockFrom = vi.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      }));

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.shortLinks).toEqual(mockShortLinks);
      });

      expect(mockFrom).toHaveBeenCalledWith('affiliate_short_links');
      expect(mockEq).toHaveBeenCalledWith('affiliate_link_id', 'affiliate-link-123');
    });

    it('should handle table not found error gracefully', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue({
          code: 'PGRST301',
          message: 'relation "affiliate_short_links" does not exist',
        }),
      }));

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.shortLinks).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('createShortLink', () => {
    it('should create short link with custom alias successfully', async () => {
      const mockAffiliateLink = {
        id: 'affiliate-link-123',
        full_url: 'https://emarzona.com/aff/ABC123',
        affiliate_id: 'affiliate-456',
      };

      const mockShortLink = {
        id: 'short-link-789',
        short_code: 'facebook',
        custom_alias: 'facebook',
        is_active: true,
        affiliate_link_id: 'affiliate-link-123',
        affiliate_id: 'affiliate-456',
        target_url: 'https://emarzona.com/aff/ABC123',
      };

      // Mock affiliate link fetch
      const mockAffiliateLinkFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockAffiliateLink,
          error: null,
        }),
      }));

      // Mock alias uniqueness check
      const mockAliasCheckFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null, // No existing alias
          error: null,
        }),
      }));

      // Mock short link creation
      const mockCreateFrom = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockShortLink,
          error: null,
        }),
      }));

      (supabase.from as unknown as jest.Mock)
        .mockReturnValueOnce(mockAffiliateLinkFrom) // First call for affiliate link
        .mockReturnValueOnce(mockAliasCheckFrom) // Second call for alias check
        .mockReturnValueOnce(mockCreateFrom); // Third call for creation

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let createdLink: unknown = null;
      await act(async () => {
        createdLink = await result.current.createShortLink({
          affiliate_link_id: 'affiliate-link-123',
          custom_alias: 'facebook',
        });
      });

      expect(createdLink).toEqual(mockShortLink);
      expect(createdLink?.short_code).toBe('facebook');
      expect(createdLink?.custom_alias).toBe('facebook');
    });

    it('should reject duplicate custom alias', async () => {
      const mockAffiliateLink = {
        id: 'affiliate-link-123',
        full_url: 'https://emarzona.com/aff/ABC123',
        affiliate_id: 'affiliate-456',
      };

      // Mock affiliate link fetch
      const mockAffiliateLinkFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockAffiliateLink,
          error: null,
        }),
      }));

      // Mock alias uniqueness check - alias already exists
      const mockAliasCheckFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'existing-link' },
          error: null,
        }),
      }));

      (supabase.from as unknown as jest.Mock)
        .mockReturnValueOnce(mockAffiliateLinkFrom)
        .mockReturnValueOnce(mockAliasCheckFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let resultValue: unknown = null;
      await act(async () => {
        resultValue = await result.current.createShortLink({
          affiliate_link_id: 'affiliate-link-123',
          custom_alias: 'facebook',
        });
      });

      expect(resultValue).toBeNull();
    });

    it('should generate random code when no custom alias provided', async () => {
      const mockAffiliateLink = {
        id: 'affiliate-link-123',
        full_url: 'https://emarzona.com/aff/ABC123',
        affiliate_id: 'affiliate-456',
      };

      const mockShortLink = {
        id: 'short-link-789',
        short_code: 'XYZ789',
        custom_alias: null,
        is_active: true,
        affiliate_link_id: 'affiliate-link-123',
        affiliate_id: 'affiliate-456',
        target_url: 'https://emarzona.com/aff/ABC123',
      };

      // Mock affiliate link fetch
      const mockAffiliateLinkFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockAffiliateLink,
          error: null,
        }),
      }));

      // Mock RPC call for code generation
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: 'XYZ789',
        error: null,
      });

      // Mock short link creation
      const mockCreateFrom = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockShortLink,
          error: null,
        }),
      }));

      (supabase.from as unknown as jest.Mock)
        .mockReturnValueOnce(mockAffiliateLinkFrom)
        .mockReturnValueOnce(mockCreateFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let createdLink: unknown = null;
      await act(async () => {
        createdLink = await result.current.createShortLink({
          affiliate_link_id: 'affiliate-link-123',
          short_code_length: 6,
        });
      });

      expect(createdLink).toEqual(mockShortLink);
      expect(createdLink?.short_code).toBe('XYZ789');
      expect(createdLink?.custom_alias).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith('generate_short_link_code', {
        p_length: 6,
      });
    });

    it('should handle RPC failure and use client-side fallback', async () => {
      const mockAffiliateLink = {
        id: 'affiliate-link-123',
        full_url: 'https://emarzona.com/aff/ABC123',
        affiliate_id: 'affiliate-456',
      };

      const mockShortLink = {
        id: 'short-link-789',
        short_code: 'ABC123',
        custom_alias: null,
        is_active: true,
        affiliate_link_id: 'affiliate-link-123',
        affiliate_id: 'affiliate-456',
        target_url: 'https://emarzona.com/aff/ABC123',
      };

      // Mock affiliate link fetch
      const mockAffiliateLinkFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockAffiliateLink,
          error: null,
        }),
      }));

      // Mock RPC failure
      (supabase.rpc as unknown as jest.Mock).mockRejectedValue(new Error('RPC function not found'));

      // Mock short link creation
      const mockCreateFrom = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockShortLink,
          error: null,
        }),
      }));

      (supabase.from as unknown as jest.Mock)
        .mockReturnValueOnce(mockAffiliateLinkFrom)
        .mockReturnValueOnce(mockCreateFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let createdLink: unknown = null;
      await act(async () => {
        createdLink = await result.current.createShortLink({
          affiliate_link_id: 'affiliate-link-123',
          short_code_length: 6,
        });
      });

      expect(createdLink).toEqual(mockShortLink);
      expect(createdLink?.short_code).toBe('ABC123');
    });

    it('should handle missing migration error', async () => {
      const mockAffiliateLink = {
        id: 'affiliate-link-123',
        full_url: 'https://emarzona.com/aff/ABC123',
        affiliate_id: 'affiliate-456',
      };

      // Mock affiliate link fetch
      const mockAffiliateLinkFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockAffiliateLink,
          error: null,
        }),
      }));

      // Mock alias check
      const mockAliasCheckFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }));

      // Mock creation failure due to missing table
      const mockCreateFrom = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue({
          code: 'PGRST301',
          message: 'relation "affiliate_short_links" does not exist',
        }),
      }));

      (supabase.from as unknown as jest.Mock)
        .mockReturnValueOnce(mockAffiliateLinkFrom)
        .mockReturnValueOnce(mockAliasCheckFrom)
        .mockReturnValueOnce(mockCreateFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let createdLink: unknown = null;
      await act(async () => {
        createdLink = await result.current.createShortLink({
          affiliate_link_id: 'affiliate-link-123',
          custom_alias: 'test',
        });
      });

      expect(createdLink).toBeNull();
    });
  });

  describe('deleteShortLink', () => {
    it('should delete short link successfully', async () => {
      const mockDeleteFrom = vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }));

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockDeleteFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.deleteShortLink('short-link-123');
      });

      expect(success).toBe(true);
      expect(mockDeleteFrom).toHaveBeenCalledWith('affiliate_short_links');
    });

    it('should handle deletion error', async () => {
      const mockDeleteFrom = vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockRejectedValue(new Error('Deletion failed')),
      }));

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockDeleteFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.deleteShortLink('short-link-123');
      });

      expect(success).toBe(false);
    });
  });

  describe('toggleShortLink', () => {
    it('should toggle short link status successfully', async () => {
      const mockUpdateFrom = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }));

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockUpdateFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.toggleShortLink('short-link-123', true);
      });

      expect(success).toBe(true);
      expect(mockUpdateFrom).toHaveBeenCalledWith('affiliate_short_links');
    });

    it('should handle toggle error', async () => {
      const mockUpdateFrom = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockRejectedValue(new Error('Toggle failed')),
      }));

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockUpdateFrom);

      const { result } = renderHook(() => useAffiliateShortLinks('affiliate-link-123'), { wrapper });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.toggleShortLink('short-link-123', false);
      });

      expect(success).toBe(false);
    });
  });
});