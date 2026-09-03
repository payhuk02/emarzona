/**
 * Tests pour le hook usePrefetch (chunks JS, pas document HTML).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefetch } from '@/hooks/usePrefetch';

const prefetchRouteChunk = vi.fn(() => true);

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

vi.mock('@/lib/wizard/prefetch-product-wizards', () => ({
  prefetchProductWizardChunks: vi.fn(),
}));

vi.mock('@/lib/route-chunk-prefetch', () => ({
  prefetchRouteChunk: (...args: unknown[]) => prefetchRouteChunk(...args),
}));

describe('usePrefetch', () => {
  const originalRic = window.requestIdleCallback;
  const originalCic = window.cancelIdleCallback;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    prefetchRouteChunk.mockClear();
    prefetchRouteChunk.mockReturnValue(true);
    // Forcer le chemin setTimeout (fake timers) — ric + fake timers = hang
    // @ts-expect-error test override
    delete window.requestIdleCallback;
    // @ts-expect-error test override
    delete window.cancelIdleCallback;
    vi.useFakeTimers();
  });

  afterEach(() => {
    window.requestIdleCallback = originalRic;
    window.cancelIdleCallback = originalCic;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('initializes without errors', () => {
    const { result } = renderHook(() => usePrefetch({ enabled: false }));
    expect(result.error).toBeUndefined();
  });

  it('précharge un chunk JS idle (pas de link as=document)', () => {
    renderHook(() =>
      usePrefetch({
        enabled: true,
        idleRoutes: ['/marketplace'],
        idleDelayMs: 0,
      })
    );

    vi.runAllTimers();

    const docPrefetch = document.head.querySelectorAll('link[rel="prefetch"][as="document"]');
    expect(docPrefetch.length).toBe(0);
    expect(prefetchRouteChunk).toHaveBeenCalledWith('/marketplace');
  });
});
