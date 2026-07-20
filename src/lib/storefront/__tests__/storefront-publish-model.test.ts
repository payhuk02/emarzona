import { describe, expect, it } from 'vitest';
import {
  getStorefrontPublishMode,
  isDraftAndPublishTab,
  isImmediatePublishTab,
} from '@/lib/storefront/storefront-publish-model';
import { STOREFRONT_STORE_PUBLIC_SELECT } from '@/lib/storefront/store-public-fields';

describe('storefront publish model', () => {
  it('uses draft_and_publish for appearance tab', () => {
    expect(getStorefrontPublishMode('appearance')).toBe('draft_and_publish');
    expect(isDraftAndPublishTab('appearance')).toBe(true);
    expect(isImmediatePublishTab('appearance')).toBe(false);
  });

  it('uses immediate publish for seo and settings tabs', () => {
    expect(getStorefrontPublishMode('seo')).toBe('immediate');
    expect(getStorefrontPublishMode('settings')).toBe('immediate');
    expect(isImmediatePublishTab('legal')).toBe(true);
  });
});

describe('store public fields', () => {
  it('does not expose custom tracking scripts on stores_public', () => {
    expect(STOREFRONT_STORE_PUBLIC_SELECT).not.toContain('custom_tracking_scripts');
    expect(STOREFRONT_STORE_PUBLIC_SELECT).not.toContain('custom_scripts_enabled');
  });
});
