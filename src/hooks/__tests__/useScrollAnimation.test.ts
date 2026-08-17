import { describe, expect, it, vi, afterEach } from 'vitest';
import { getScrollParent } from '@/hooks/useScrollAnimation';

describe('getScrollParent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ancestor with overflow auto/scroll', () => {
    const scroll = document.createElement('main');
    const child = document.createElement('div');
    scroll.appendChild(child);
    document.body.appendChild(scroll);

    vi.spyOn(window, 'getComputedStyle').mockImplementation(el => {
      if (el === scroll) {
        return { overflowY: 'auto', overflow: 'visible' } as CSSStyleDeclaration;
      }
      return { overflowY: 'visible', overflow: 'visible' } as CSSStyleDeclaration;
    });

    expect(getScrollParent(child)).toBe(scroll);

    document.body.removeChild(scroll);
  });

  it('returns null when no scrollable ancestor', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflowY: 'visible',
      overflow: 'visible',
    } as CSSStyleDeclaration);

    expect(getScrollParent(el)).toBeNull();

    document.body.removeChild(el);
  });
});
