import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNearDocumentBottom } from '@/hooks/useNearDocumentBottom';

describe('useNearDocumentBottom', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts not near bottom', () => {
    const { result } = renderHook(() => useNearDocumentBottom('p1'));
    expect(result.current.nearBottom).toBe(false);
    expect(result.current.sentinelRef.current).toBeNull();
  });

  it('marks near bottom when sentinel is in the viewport', () => {
    const { result } = renderHook(() => useNearDocumentBottom('p1'));
    const el = document.createElement('div');
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: 100, bottom: 101, left: 0, right: 0, width: 0, height: 1 }),
    });
    result.current.sentinelRef.current = el;

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.nearBottom).toBe(true);
  });
});
