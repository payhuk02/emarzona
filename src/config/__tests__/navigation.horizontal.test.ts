import { describe, expect, it } from 'vitest';
import {
  isBuyerDiscoveryPath,
  resolveHorizontalNavPersona,
  shouldShowBottomNavigation,
  shouldShowBuyerHorizontalNav,
  shouldShowHorizontalNav,
  shouldShowSellerHorizontalNav,
} from '@/config/navigation.horizontal';

describe('navigation.horizontal visibility', () => {
  it('shows seller horizontal nav on dashboard routes', () => {
    expect(shouldShowSellerHorizontalNav('/dashboard')).toBe(true);
    expect(shouldShowSellerHorizontalNav('/dashboard/products')).toBe(true);
    expect(shouldShowSellerHorizontalNav('/account')).toBe(false);
  });

  it('shows buyer horizontal nav on account routes', () => {
    expect(shouldShowBuyerHorizontalNav('/account')).toBe(true);
    expect(shouldShowBuyerHorizontalNav('/account/orders')).toBe(true);
    expect(shouldShowBuyerHorizontalNav('/cart')).toBe(false);
    expect(shouldShowBuyerHorizontalNav('/dashboard')).toBe(false);
  });

  it('shows buyer horizontal nav on discovery routes', () => {
    expect(isBuyerDiscoveryPath('/marketplace')).toBe(true);
    expect(isBuyerDiscoveryPath('/auctions/slug-lot')).toBe(true);
    expect(shouldShowBuyerHorizontalNav('/recommendations')).toBe(true);
    expect(shouldShowBuyerHorizontalNav('/discover')).toBe(true);
    expect(shouldShowBuyerHorizontalNav('/trending')).toBe(true);
    expect(shouldShowBuyerHorizontalNav('/personalization/quiz')).toBe(true);
  });

  it('hides bottom nav on checkout and admin routes', () => {
    expect(shouldShowBottomNavigation('/checkout')).toBe(false);
    expect(shouldShowBottomNavigation('/checkout/payment')).toBe(false);
    expect(shouldShowBottomNavigation('/admin')).toBe(false);
    expect(shouldShowBottomNavigation('/admin/users')).toBe(false);
    expect(shouldShowBottomNavigation('/account')).toBe(true);
    expect(shouldShowBottomNavigation('/')).toBe(false);
    expect(shouldShowBottomNavigation('/login')).toBe(false);
  });

  it('combines seller and buyer visibility', () => {
    expect(shouldShowHorizontalNav('/dashboard')).toBe(true);
    expect(shouldShowHorizontalNav('/account/profile')).toBe(true);
    expect(shouldShowHorizontalNav('/marketplace')).toBe(true);
    expect(shouldShowHorizontalNav('/recommendations')).toBe(true);
  });

  it('resolves persona from pathname', () => {
    expect(resolveHorizontalNavPersona('/account/digital')).toBe('buyer');
    expect(resolveHorizontalNavPersona('/dashboard/orders')).toBe('seller');
    // default preferredPersona is seller → marketplace keeps seller chrome
    expect(resolveHorizontalNavPersona('/marketplace')).toBe('seller');
    expect(resolveHorizontalNavPersona('/marketplace', 'buyer')).toBe('buyer');
    expect(resolveHorizontalNavPersona('/recommendations', 'buyer')).toBe('buyer');
  });

  it('keeps seller chrome on marketplace when seller is pinned', () => {
    expect(resolveHorizontalNavPersona('/marketplace', 'seller')).toBe('seller');
    expect(resolveHorizontalNavPersona('/auctions', 'seller')).toBe('seller');
    expect(resolveHorizontalNavPersona('/dashboard', 'buyer')).toBe('seller');
    expect(resolveHorizontalNavPersona('/account/orders', 'seller')).toBe('buyer');
  });

  it('uses preferred persona on shared notification routes', () => {
    expect(resolveHorizontalNavPersona('/notifications', 'buyer')).toBe('buyer');
    expect(resolveHorizontalNavPersona('/notifications', 'seller')).toBe('seller');
    expect(resolveHorizontalNavPersona('/settings/notifications', 'buyer')).toBe('buyer');
  });
});
