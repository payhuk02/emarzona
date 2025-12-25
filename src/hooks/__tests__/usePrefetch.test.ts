/**
 * Tests pour le hook usePrefetch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefetch } from '@/hooks/usePrefetch';

// Mock React Router
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => vi.fn(),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    prefetchQuery: vi.fn(),
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
  },
}));

describe('usePrefetch', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes without errors', () => {
    const { result } = renderHook(() => usePrefetch());
    expect(result.error).toBeUndefined();
  });

  it('creates prefetch links for frequent routes', () => {
    renderHook(() => usePrefetch({
      routes: ['/dashboard/products', '/marketplace'],
    }));

    // Vérifier que les liens de prefetch sont créés
    const links = document.head.querySelectorAll('link[rel="prefetch"]');
    expect(links.length).toBeGreaterThan(0);
  });
});

