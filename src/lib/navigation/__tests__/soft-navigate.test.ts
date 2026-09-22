import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  softNavigate,
  softNavigateTo,
  registerSoftNavigate,
  isAbsoluteHttpUrl,
  toSoftNavTarget,
} from '@/lib/navigation/soft-navigate';

describe('softNavigate', () => {
  const navigate = vi.fn();

  beforeEach(() => {
    navigate.mockClear();
    registerSoftNavigate(null);
    vi.stubGlobal('location', {
      ...window.location,
      origin: 'https://www.emarzona.com',
      assign: vi.fn(),
    });
  });

  afterEach(() => {
    registerSoftNavigate(null);
    vi.unstubAllGlobals();
  });

  it('détecte les URLs absolues', () => {
    expect(isAbsoluteHttpUrl('/dashboard')).toBe(false);
    expect(isAbsoluteHttpUrl('https://x.com/a')).toBe(true);
  });

  it('toSoftNavTarget normalise same-origin', () => {
    expect(toSoftNavTarget('/dashboard')).toBe('/dashboard');
    expect(toSoftNavTarget('https://www.emarzona.com/marketplace?q=1')).toBe('/marketplace?q=1');
    expect(toSoftNavTarget('https://shop.myemarzona.shop/p')).toBe(
      'https://shop.myemarzona.shop/p'
    );
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

  it('softNavigateTo utilise le navigate enregistré', () => {
    registerSoftNavigate(navigate);
    softNavigateTo('/account/orders');
    expect(navigate).toHaveBeenCalledWith('/account/orders');
  });

  it('softNavigateTo sans registrant pushState + popstate (pas assign)', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    softNavigateTo('/login');
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(pushState).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expect.any(PopStateEvent));
    expect(navigate).not.toHaveBeenCalled();
    pushState.mockRestore();
    dispatch.mockRestore();
  });

  it('softNavigateTo sans registrant normalise same-origin absolu', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    softNavigateTo('https://www.emarzona.com/login');
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(pushState).toHaveBeenCalledWith(null, '', '/login');
    pushState.mockRestore();
  });

  it('registerSoftNavigate(null) désenregistre puis pushState relatif', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    registerSoftNavigate(navigate);
    registerSoftNavigate(null);
    softNavigateTo('/dashboard');
    expect(navigate).not.toHaveBeenCalled();
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(pushState).toHaveBeenCalled();
    pushState.mockRestore();
  });
});

describe('redirectToPlatformLogin on-platform', () => {
  const navigate = vi.fn();

  beforeEach(() => {
    navigate.mockClear();
    registerSoftNavigate(null);
    vi.resetModules();
  });

  afterEach(() => {
    registerSoftNavigate(null);
    vi.doUnmock('@/lib/subdomain-detector');
    vi.unstubAllGlobals();
  });

  it('utilise softNavigateTo quand navigate est absent sur plateforme', async () => {
    vi.doMock('@/lib/subdomain-detector', () => ({
      detectSubdomain: () => ({ isPlatformDomain: true }),
    }));
    vi.stubGlobal('location', {
      origin: 'https://www.emarzona.com',
      assign: vi.fn(),
    });

    const { registerSoftNavigate: reg, softNavigateTo: softTo } =
      await import('@/lib/navigation/soft-navigate');
    const { redirectToPlatformLogin } = await import('@/lib/auth-routes');

    reg(navigate);
    redirectToPlatformLogin();
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(window.location.assign).not.toHaveBeenCalled();

    softTo('/register');
    expect(navigate).toHaveBeenCalledWith('/register');
  });
});
