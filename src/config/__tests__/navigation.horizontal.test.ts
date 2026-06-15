import { describe, expect, it } from 'vitest';
import {
  resolveHorizontalNavPersona,
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
    expect(shouldShowBuyerHorizontalNav('/checkout/multi-store-tracking')).toBe(true);
    expect(shouldShowBuyerHorizontalNav('/dashboard')).toBe(false);
  });

  it('combines seller and buyer visibility', () => {
    expect(shouldShowHorizontalNav('/dashboard')).toBe(true);
    expect(shouldShowHorizontalNav('/account/profile')).toBe(true);
    expect(shouldShowHorizontalNav('/marketplace')).toBe(false);
  });

  it('resolves persona from pathname', () => {
    expect(resolveHorizontalNavPersona('/account/digital')).toBe('buyer');
    expect(resolveHorizontalNavPersona('/dashboard/orders')).toBe('seller');
  });
});
