import { describe, expect, it, vi } from 'vitest';
import { invalidateProductEditCache } from '@/lib/products/invalidate-product-edit-cache';
import type { QueryClient } from '@tanstack/react-query';

describe('invalidateProductEditCache', () => {
  it('removes the product edit query for the given prefix', () => {
    const removeQueries = vi.fn();
    const queryClient = { removeQueries } as unknown as QueryClient;

    invalidateProductEditCache(queryClient, 'prod-1', 'digital-product-edit');

    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['digital-product-edit', 'prod-1'],
    });
  });

  it('removes all edit prefixes by default', () => {
    const removeQueries = vi.fn();
    const queryClient = { removeQueries } as unknown as QueryClient;

    invalidateProductEditCache(queryClient, 'prod-2');

    expect(removeQueries).toHaveBeenCalledTimes(6);
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['digital-product-edit', 'prod-2'],
    });
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['course-product-edit', 'prod-2'],
    });
  });
});
