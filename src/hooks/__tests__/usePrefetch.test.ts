/**
 * Tests pour le hook usePrefetch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefetch } from '@/hooks/usePrefetch';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/dashboard' }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    prefetchQuery: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
  },
}));

describe('usePrefetch', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('initializes without errors', () => {
    const { result } = renderHook(() => usePrefetch({ enabled: false }));
    expect(result.error).toBeUndefined();
  });

  it('creates prefetch links for idle routes when enabled', () => {
    renderHook(() =>
      usePrefetch({
        enabled: true,
        idleRoutes: ['/marketplace'],
        idleDelayMs: 0,
      })
    );

    vi.runAllTimers();

    const links = document.head.querySelectorAll('link[rel="prefetch"]');
    expect(links.length).toBeGreaterThan(0);
  });
});
