import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { softNavigate, isAbsoluteHttpUrl } from '@/lib/navigation/soft-navigate';

describe('softNavigate', () => {
  const navigate = vi.fn();

  beforeEach(() => {
    navigate.mockClear();
    vi.stubGlobal('location', {
      ...window.location,
      origin: 'https://www.emarzona.com',
      assign: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('détecte les URLs absolues', () => {
    expect(isAbsoluteHttpUrl('/dashboard')).toBe(false);
    expect(isAbsoluteHttpUrl('https://x.com/a')).toBe(true);
  });

  it('utilise navigate pour les chemins relatifs', () => {
    softNavigate(navigate, '/dashboard/orders');
    expect(navigate).toHaveBeenCalledWith('/dashboard/orders');
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('utilise navigate pour même origine', () => {
    softNavigate(navigate, 'https://www.emarzona.com/marketplace?q=1');
    expect(navigate).toHaveBeenCalledWith('/marketplace?q=1');
  });

  it('assigne pour sous-domaine externe', () => {
    softNavigate(navigate, 'https://shop.myemarzona.shop/products/x');
    expect(window.location.assign).toHaveBeenCalledWith('https://shop.myemarzona.shop/products/x');
    expect(navigate).not.toHaveBeenCalled();
  });
});
