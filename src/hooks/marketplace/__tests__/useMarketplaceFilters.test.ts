/**
 * Tests pour le hook useMarketplaceFilters
 * Couvre la gestion des filtres du marketplace
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMarketplaceFilters } from '../useMarketplaceFilters';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
  },
}));

describe('useMarketplaceFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useMarketplaceFilters());

    expect(result.current.filters.category).toBe('all');
    expect(result.current.filters.productType).toBe('all');
    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.viewMode).toBe('grid');
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should update filters correctly', () => {
    const { result } = renderHook(() => useMarketplaceFilters());

    act(() => {
      result.current.updateFilter({ category: 'digital' });
    });

    expect(result.current.filters.category).toBe('digital');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => useMarketplaceFilters());

    // Set some filters
    act(() => {
      result.current.updateFilter({ category: 'digital', search: 'test' });
    });

    expect(result.current.hasActiveFilters).toBe(true);

    // Clear filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.category).toBe('all');
    expect(result.current.filters.search).toBe('');
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should detect active filters correctly', () => {
    const { result } = renderHook(() => useMarketplaceFilters());

    // No active filters initially
    expect(result.current.hasActiveFilters).toBe(false);

    // Activate search filter
    act(() => {
      result.current.updateFilter({ search: 'test' });
    });
    expect(result.current.hasActiveFilters).toBe(true);

    // Activate category filter
    act(() => {
      result.current.updateFilter({ category: 'physical' });
    });
    expect(result.current.hasActiveFilters).toBe(true);

    // Activate tags filter
    act(() => {
      result.current.updateFilter({ tags: ['tag1'] });
    });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should provide PRICE_RANGES constant', () => {
    const { result } = renderHook(() => useMarketplaceFilters());

    expect(result.current.PRICE_RANGES).toBeDefined();
    expect(Array.isArray(result.current.PRICE_RANGES)).toBe(true);
    expect(result.current.PRICE_RANGES.length).toBeGreaterThan(0);
  });

  it('should provide SORT_OPTIONS constant', () => {
    const { result } = renderHook(() => useMarketplaceFilters());

    expect(result.current.SORT_OPTIONS).toBeDefined();
    expect(Array.isArray(result.current.SORT_OPTIONS)).toBe(true);
    expect(result.current.SORT_OPTIONS.length).toBeGreaterThan(0);
  });

  it('should update multiple filters at once', () => {
    const { result } = renderHook(() => useMarketplaceFilters());

    act(() => {
      result.current.updateFilter({
        category: 'digital',
        productType: 'software',
        search: 'test',
        rating: '4',
      });
    });

    expect(result.current.filters.category).toBe('digital');
    expect(result.current.filters.productType).toBe('software');
    expect(result.current.filters.search).toBe('test');
    expect(result.current.filters.rating).toBe('4');
  });
});
