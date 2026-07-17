import { describe, expect, it } from 'vitest';
import {
  getStoreHeaderProfile,
  resolveStorefrontCommerceType,
  resolveStoreHeaderTabs,
  resolveStoreHeroSubtitle,
  showStoreLocationInContact,
  storeHasContactSection,
} from '@/lib/commerce/store-header-config';

describe('store-header-config', () => {
  it('returns digital-specific trust badges and tab labels', () => {
    const profile = getStoreHeaderProfile('digital');
    expect(profile.trustBadges.map(b => b.id)).toContain('instant-access');
    expect(profile.valueProps).toHaveLength(4);
    expect(profile.tabs.productsLabelKey).toBe('storefront.tabs.productsDigital');
  });

  it('returns service-specific tab label', () => {
    expect(getStoreHeaderProfile('service').tabs.productsLabelKey).toBe('storefront.tabs.services');
  });

  it('infers commerce type from catalog when store type is missing', () => {
    expect(
      resolveStorefrontCommerceType(null, [
        { product_type: 'digital' },
        { product_type: 'digital' },
      ])
    ).toBe('digital');
  });

  it('prefers typed store commerce_type over product inference', () => {
    expect(
      resolveStorefrontCommerceType({ commerce_type: 'course' }, [{ product_type: 'digital' }])
    ).toBe('course');
  });

  it('hides contact tab when no contact fields are configured', () => {
    const tabs = resolveStoreHeaderTabs('digital', {
      id: 's1',
      name: 'Test',
      slug: 'test',
      is_active: true,
      created_at: '',
      updated_at: '',
      user_id: 'u1',
    });
    expect(tabs.showContact).toBe(false);
  });

  it('shows contact tab when email is configured', () => {
    const tabs = resolveStoreHeaderTabs('digital', {
      id: 's1',
      name: 'Test',
      slug: 'test',
      is_active: true,
      created_at: '',
      updated_at: '',
      user_id: 'u1',
      contact_email: 'hello@example.com',
    });
    expect(tabs.showContact).toBe(true);
  });

  it('uses custom subtitle when provided', () => {
    expect(
      resolveStoreHeroSubtitle('digital', {
        customSubtitle: 'Mon sous-titre custom',
      })
    ).toBe('Mon sous-titre custom');
  });

  it('falls back to vertical default subtitle', () => {
    expect(resolveStoreHeroSubtitle('course', {})).toContain('Apprenez');
  });

  it('shows location block for physical and service stores', () => {
    expect(showStoreLocationInContact('physical')).toBe(true);
    expect(showStoreLocationInContact('service')).toBe(true);
    expect(showStoreLocationInContact('digital')).toBe(false);
    expect(showStoreLocationInContact('course')).toBe(false);
  });

  it('detects contact section availability', () => {
    expect(storeHasContactSection(null)).toBe(false);
    expect(storeHasContactSection({ contact_phone: '+221000000' } as never)).toBe(true);
  });
});
