import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottle, useThrottledCallback, useThrottledCallbackAdvanced } from '../useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should throttle value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottle(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    act(() => {
      rerender({ value: 'updated', delay: 300 });
    });

    // Should still be initial immediately
    expect(result.current).toBe('initial');

    // After delay, should be updated
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });

  it('should use default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value),
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
});

describe('useThrottledCallback', () => {
  let time = 0;
  
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock Date.now() to return controlled time
    global.Date.now = vi.fn(() => time);
    time = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    time = 0;
  });

  it('should throttle function calls', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(mockFn, 300)
    );

    // First call - will schedule a timeout since Date.now() - lastRan.current < delay
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(0); // Not called yet, scheduled

    // Call again multiple times - should cancel previous and schedule new one
    act(() => {
      result.current();
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(0); // Still not called

    // Advance time past delay - should execute trailing call
    act(() => {
      time = 300;
      vi.advanceTimersByTime(300);
    });
    expect(mockFn).toHaveBeenCalledTimes(1); // Trailing call executed
  });

  it('should pass arguments correctly', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(mockFn, 300)
    );

    act(() => {
      result.current('arg1', 'arg2', 42);
    });

    // Not called immediately, scheduled for later
    expect(mockFn).toHaveBeenCalledTimes(0);

    // Advance time to trigger the call
    act(() => {
      time = 300;
      vi.advanceTimersByTime(300);
    });
    
    // Should be called with arguments
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 42);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle different delay values', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(mockFn, 500)
    );

    // First call - scheduled
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(0);

    // Advance past delay - first call executes
    act(() => {
      time = 500;
      vi.advanceTimersByTime(500);
    });
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Second call - scheduled again
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(1); // Still 1

    // Advance past delay again
    act(() => {
      time = 1000;
      vi.advanceTimersByTime(500);
    });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('useThrottledCallbackAdvanced', () => {
  let time = 0;
  
  beforeEach(() => {
    vi.useFakeTimers();
    global.Date.now = vi.fn(() => time);
    time = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    time = 0;
  });

  it('should respect leading option', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallbackAdvanced(mockFn, 300, { leading: true, trailing: false })
    );

    // At time 0, lastRan is 0, so timeSinceLastRun = 0 < delay
    // Leading won't execute immediately, will schedule trailing if trailing=true
    // But with trailing=false, nothing happens immediately
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(0); // Not executed yet

    // Set time high enough so next call will trigger leading
    act(() => {
      time = 300;
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(1); // Leading call executes now

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockFn).toHaveBeenCalledTimes(1); // No trailing call
  });

  it('should respect trailing option', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallbackAdvanced(mockFn, 300, { leading: false, trailing: true })
    );

    // Call with leading: false - should not execute immediately
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(0); // No leading call

    // Advance time - trailing call should execute
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockFn).toHaveBeenCalledTimes(1); // Trailing call
  });

  it('should use both leading and trailing by default', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallbackAdvanced(mockFn, 300)
    );

    // At time 0, lastRan is 0, so timeSinceLastRun = 0 < delay
    // Leading won't execute, but trailing will be scheduled
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(0); // Not executed yet, scheduled

    // Advance time to trigger first trailing call
    act(() => {
      time = 300;
      vi.advanceTimersByTime(300);
    });
    expect(mockFn).toHaveBeenCalledTimes(1); // First trailing call executed
    // Now lastRan.current should be 300

    // Advance time so next call will be >= delay (leading executes)
    act(() => {
      time = 600; // 600 - 300 = 300 >= delay, so leading executes
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(2); // Leading call executed

    // Call within throttle window (before delay passes) - trailing scheduled
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(2); // Still 2, trailing scheduled

    // Advance time - trailing call executes
    act(() => {
      time = 900;
      vi.advanceTimersByTime(300);
    });
    expect(mockFn).toHaveBeenCalledTimes(3); // Trailing call
  });

  it('should use last arguments for trailing call', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallbackAdvanced(mockFn, 300, { leading: false, trailing: true })
    );

    // Multiple calls with different arguments
    act(() => {
      result.current('first');
      result.current('second');
      result.current('third');
    });
    expect(mockFn).toHaveBeenCalledTimes(0); // No leading calls

    // Advance time - should use last arguments
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third'); // Last arguments
  });
});

