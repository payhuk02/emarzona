import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeferHorizontalContextNav } from '@/hooks/useDeferHorizontalContextNav';

describe('useDeferHorizontalContextNav', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true immediately on non-dashboard routes', () => {
    const { result } = renderHook(() => useDeferHorizontalContextNav('/dashboard/orders'));
    expect(result.current).toBe(true);
  });

  it('defers on /dashboard then becomes ready after timeout', () => {
    const { result } = renderHook(() => useDeferHorizontalContextNav('/dashboard', 200));

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);
  });
});
