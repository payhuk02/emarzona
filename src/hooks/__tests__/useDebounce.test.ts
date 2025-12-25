import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    act(() => {
      rerender({ value: 'updated', delay: 300 });
    });

    // Should still be initial value immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 299ms - should still be initial
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Fast-forward by 1ms more - should be updated
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should use default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      {
        initialProps: { value: 'initial' },
      }
    );

    expect(result.current).toBe('initial');

    act(() => {
      rerender({ value: 'updated' });
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle multiple rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'value1' },
      }
    );

    // Rapid changes
    act(() => {
      rerender({ value: 'value2' });
      vi.advanceTimersByTime(100);
      rerender({ value: 'value3' });
      vi.advanceTimersByTime(100);
      rerender({ value: 'value4' });
    });

    // Should still be initial after 200ms
    expect(result.current).toBe('value1');

    // After full delay, should be last value
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('value4');
  });

  it('should work with numbers', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 0 },
      }
    );

    expect(result.current).toBe(0);

    act(() => {
      rerender({ value: 42 });
    });
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(42);
  });

  it('should work with objects', () => {
    const initialObj = { key: 'value1' };
    const updatedObj = { key: 'value2' };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: initialObj },
      }
    );

    expect(result.current).toBe(initialObj);

    act(() => {
      rerender({ value: updatedObj });
    });
    expect(result.current).toBe(initialObj);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(updatedObj);
  });

  it('should clear timeout on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'initial' },
      }
    );

    act(() => {
      rerender({ value: 'updated' });
      unmount();
    });

    // Advance time - should not cause errors
    act(() => {
      vi.advanceTimersByTime(300);
    });
  });
});

