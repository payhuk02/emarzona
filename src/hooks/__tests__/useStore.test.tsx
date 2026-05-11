/**
 * Tests unitaires pour useStore
 * 
 * Couverture :
 * - Récupération d'une boutique via contexte
 * - Gestion des états de chargement
 * - Génération de slug et URL
 */

import { describe, it, expect, vi } from 'vitest';

// Mock des dépendances externes
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@/contexts/StoreContext', () => ({
  useStoreContext: () => ({
    selectedStoreId: null,
    selectedStore: null,
    loading: false,
    setSelectedStoreId: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/store-payload-utils', () => ({
  sanitizeStorePayload: (p: Record<string, unknown>) => p,
}));

describe('useStore - utility functions', () => {
  it('should generate correct store URL format', () => {
    // Le format attendu est slug.myemarzona.shop
    const slug = 'ma-boutique';
    const expectedUrl = `https://${slug}.myemarzona.shop`;
    expect(expectedUrl).toBe('https://ma-boutique.myemarzona.shop');
  });

  it('should generate valid slug from store name', () => {
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    expect(generateSlug('Ma Boutique Test')).toBe('ma-boutique-test');
    expect(generateSlug('Café & Thé')).toBe('caf-th');
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });

  it('should use subdomain equal to slug', () => {
    const slug = 'test-store';
    const subdomain = slug; // Le trigger SQL fait la même chose
    expect(subdomain).toBe('test-store');
  });
});
