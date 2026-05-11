import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecommendationService, RecommendationSettings, type RecommendedProduct } from '../recommendationService';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { ChatSessionContext } from '../chatbot'; // Import added for explicit type casting

// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      neq: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockSupabaseFrom = vi.mocked(supabase.from);

describe('RecommendationService', () => {
  let service: RecommendationService;

  const mockSettings: RecommendationSettings = {
    algorithms: {
      collaborative: true,
      contentBased: true,
      trending: true,
      behavioral: true,
      crossType: false,
    },
    weights: {
      collaborative: 25,
      contentBased: 30,
      trending: 20,
      behavioral: 20,
      crossType: 5,
    },
    similarity: {
      categoryWeight: 30,
      tagsWeight: 25,
      priceWeight: 20,
      typeWeight: 25,
      priceTolerance: 20,
    },
    productTypes: {
      digital: { enabled: true, maxRecommendations: 6, similarityThreshold: 0.3 },
      physical: { enabled: true, maxRecommendations: 6, similarityThreshold: 0.3 },
      service: { enabled: true, maxRecommendations: 4, similarityThreshold: 0.4 },
      course: { enabled: true, maxRecommendations: 4, similarityThreshold: 0.4 },
      artist: { enabled: true, maxRecommendations: 3, similarityThreshold: 0.5 },
    },
    limits: {
      maxRecommendationsPerPage: 8,
      minConfidenceThreshold: 0.3,
      cacheExpiryMinutes: 30,
      enablePersonalization: true,
    },
    fallbacks: {
      fallbackToTrending: true,
      fallbackToPopular: true,
      fallbackToCategory: true,
      fallbackToStore: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock loading settings to return our mockSettings
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { ai_recommendation_settings: mockSettings }, error: null }),
    } as {
      select: () => { eq: () => { maybeSingle: () => Promise<{ data: { ai_recommendation_settings: RecommendationSettings } | null; error: any }> } }
    });

    service = new RecommendationService();
  });

  describe('loadSettings', () => {
    it('should load settings from supabase', async () => {
      // Force reload settings to ensure mock is used
      await (service as { loadSettings: () => Promise<void> }).loadSettings();
      expect(mockSupabaseFrom).toHaveBeenCalledWith('platform_settings');
      expect((service as { settings: RecommendationSettings }).settings.limits.maxRecommendationsPerPage).toBe(8);
    });

    it('should use default settings if supabase returns no data', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { ai_recommendation_settings: null }, error: null }),
      } as { select: () => { eq: () => { maybeSingle: () => Promise<{ data: { ai_recommendation_settings: null } | null; error: any }> } } });

      await (service as { loadSettings: () => Promise<void> }).loadSettings();
      // Check against a default value that is different from mockSettings
      expect((service as { settings: RecommendationSettings }).settings.limits.maxRecommendationsPerPage).not.toBe(mockSettings.limits.maxRecommendationsPerPage);
      expect(logger.warn).toHaveBeenCalledWith('Invalid recommendation settings format, using defaults.');
    });

    it('should use default settings if there is a supabase error', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      } as { select: () => { eq: () => { maybeSingle: () => Promise<{ data: null; error: Error }> } } });

      await (service as { loadSettings: () => Promise<void> }).loadSettings();
      expect((service as { settings: RecommendationSettings }).settings.limits.maxRecommendationsPerPage).not.toBe(mockSettings.limits.maxRecommendationsPerPage);
      expect(logger.error).toHaveBeenCalledWith('Error loading recommendation settings', expect.any(Object));
    });
  });

  describe('getRecommendations', () => {
    it('should return an empty array if no algorithms are enabled', async () => {
      // Temporarily disable all algorithms
      service.updateSettings({ ...mockSettings, algorithms: { collaborative: false, contentBased: false, trending: false, behavioral: false, crossType: false } });
      const recommendations = await service.getRecommendations('user1', {});
      expect(recommendations).toEqual([]);
    });

    it('should aggregate, deduplicate, and limit recommendations', async () => {
      // Mock calls for popular products as a base for all algorithms
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [
          { id: 'p1', name: 'Product 1', category: 'cat1', type: 'digital' },
          { id: 'p2', name: 'Product 2', category: 'cat2', type: 'physical' },
          { id: 'p3', name: 'Product 3', category: 'cat1', type: 'digital' },
        ], error: null }),
      } as {
        select: () => { order: () => { limit: () => Promise<{ data: any[]; error: any }> } },
      });

      const recommendations = await service.getRecommendations('user1', {});
      expect(recommendations.length).toBeLessThanOrEqual(mockSettings.limits.maxRecommendationsPerPage);
      // Ensure no duplicates by ID
      const ids = recommendations.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should apply fallback to trending if initial recommendations are insufficient', async () => {
      // Mock all algo functions to return fewer than maxRecommendationsPerPage
      vi.spyOn(service as { getCollaborativeRecommendations: (userId: string | undefined, _sessionContext: ChatSessionContext) => Promise<RecommendedProduct[]> }, 'getCollaborativeRecommendations').mockResolvedValue([]);
      vi.spyOn(service as { getContentBasedRecommendations: (currentProductId: string | undefined, _sessionContext: ChatSessionContext) => Promise<RecommendedProduct[]> }, 'getContentBasedRecommendations').mockResolvedValue([]);
      vi.spyOn(service as { getBehavioralRecommendations: (userId: string | undefined, _sessionContext: ChatSessionContext) => Promise<RecommendedProduct[]> }, 'getBehavioralRecommendations').mockResolvedValue([]);
      vi.spyOn(service as { getCrossTypeRecommendations: (currentProductId: string | undefined, _sessionContext: ChatSessionContext) => Promise<RecommendedProduct[]> }, 'getCrossTypeRecommendations').mockResolvedValue([]);

      // Mock getTrendingRecommendations to return some products for fallback
      vi.spyOn(service as any, 'getTrendingRecommendations').mockResolvedValueOnce([ // eslint-disable-line @typescript-eslint/no-explicit-any
        { id: 't1', name: 'Trending 1', category: 't_cat', type: 'digital', score: 0.9, reason: 'trending' },
        { id: 't2', name: 'Trending 2', category: 't_cat', type: 'digital', score: 0.8, reason: 'trending' },
      ]);

      // Mock getPopularProducts for internal fallback call (getTrendingRecommendations uses it)
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [
          { id: 't1', name: 'Trending 1', category: 't_cat', type: 'digital' },
          { id: 't2', name: 'Trending 2', category: 't_cat', type: 'digital' },
        ], error: null }),
      } as {
        select: () => { order: () => { limit: () => Promise<{ data: any[]; error: any }> } },
      });

      const recommendations = await service.getRecommendations('user1', {});
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.id === 't1')).toBe(true);
    });

    it('should not fetch personalized recommendations if personalization is disabled', async () => {
      service.updateSettings({ ...mockSettings, limits: { ...mockSettings.limits, enablePersonalization: false } });
      vi.spyOn(service as { getCollaborativeRecommendations: (userId: string | undefined, _sessionContext: ChatSessionContext) => Promise<RecommendedProduct[]> }, 'getCollaborativeRecommendations').mockResolvedValue([]);
      const spyCollab = vi.spyOn(service as { getCollaborativeRecommendations: (userId: string | undefined, _sessionContext: ChatSessionContext) => Promise<RecommendedProduct[]> }, 'getCollaborativeRecommendations');
      const spyBehav = vi.spyOn(service as { getBehavioralRecommendations: (userId: string | undefined, _sessionContext: ChatSessionContext) => Promise<RecommendedProduct[]> }, 'getBehavioralRecommendations');

      // Mock getPopularProducts for other algorithm calls
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as {
        select: () => { order: () => { limit: () => Promise<{ data: any[]; error: any }> } },
      });

      await service.getRecommendations('user1', {});
      expect(spyCollab).toHaveBeenCalledWith(undefined, expect.any(Object)); // userId should be undefined
      expect(spyBehav).toHaveBeenCalledWith(undefined, expect.any(Object)); // userId should be undefined
    });
  });

  // Test for getPopularProducts (utility function)
  describe('getPopularProducts', () => {
    it('should fetch products ordered by view_count', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn(() => ({
          ascending: vi.fn().mockReturnThis(),
        })),
        limit: vi.fn().mockResolvedValueOnce({ data: [{ id: 'pop1', name: 'Popular Product', category: 'cat', type: 'digital' }], error: null }),
      } as {
        select: () => { order: (column: string, options: { ascending: boolean }) => { limit: () => Promise<{ data: any[]; error: any }> } },
      });

      const products = await (service as { getPopularProducts: (limit: number, score: number, reasonTag: string, reasonText: string) => Promise<RecommendedProduct[]> }).getPopularProducts(1, 0.8, 'test', 'test reason');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('products');
      expect(mockSupabaseFrom().select).toHaveBeenCalledWith('id, name, category, type');
      expect(mockSupabaseFrom().order).toHaveBeenCalledWith('view_count', { ascending: false });
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe('pop1');
      expect(products[0].score).toBe(0.8);
    });
  });

  // Test for getCategoryRecommendations
  describe('getCategoryRecommendations', () => {
    it('should fetch products from the same category', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { category: 'Electronics' }, error: null }),
      } as {
        select: () => { eq: () => { single: () => Promise<{ data: { category: string } | null; error: any }> } },
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [{ id: 'cat2', name: 'Category Product', category: 'Electronics', type: 'physical' }], error: null }),
      } as {
        select: () => { eq: () => { neq: () => { order: () => { limit: () => Promise<{ data: any[]; error: any }> } } } },
      });

      const products = await (service as { getCategoryRecommendations: (currentProductId: string, limit: number, score: number) => Promise<RecommendedProduct[]> }).getCategoryRecommendations('prod1', 1, 0.7);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('products'); // Called twice
      expect(products).toHaveLength(1);
      expect(products[0].category).toBe('Electronics');
    });
  });

  // Test for getStoreRecommendations
  describe('getStoreRecommendations', () => {
    it('should fetch products from the same store', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { store_id: 'store1' }, error: null }),
      } as {
        select: () => { eq: () => { single: () => Promise<{ data: { store_id: string } | null; error: any }> } },
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [{ id: 'st2', name: 'Store Product', category: 'cat', type: 'digital' }], error: null }),
      } as {
        select: () => { eq: () => { neq: () => { order: () => { limit: () => Promise<{ data: any[]; error: any }> } } } },
      });

      const products = await (service as { getStoreRecommendations: (currentProductId: string, limit: number, score: number) => Promise<RecommendedProduct[]> }).getStoreRecommendations('prod1', 1, 0.7);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('products'); // Called twice
      expect(products).toHaveLength(1);
    });
  });
});
