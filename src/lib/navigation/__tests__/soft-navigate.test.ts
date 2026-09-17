import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  softNavigate,
  softNavigateTo,
  registerSoftNavigate,
  isAbsoluteHttpUrl,
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

  it('softNavigateTo sans registrant hard-assigne un chemin relatif', () => {
    softNavigateTo('/login');
    expect(window.location.assign).toHaveBeenCalledWith('/login');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('registerSoftNavigate(null) désenregistre', () => {
    registerSoftNavigate(navigate);
    registerSoftNavigate(null);
    softNavigateTo('/dashboard');
    expect(navigate).not.toHaveBeenCalled();
    expect(window.location.assign).toHaveBeenCalledWith('/dashboard');
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

    // also covers softTo path when used directly
    softTo('/register');
    expect(navigate).toHaveBeenCalledWith('/register');
  });
});
