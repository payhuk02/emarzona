import { describe, expect, it } from 'vitest';
import {
  getStorefrontPublishMode,
  isDraftAndPublishTab,
  isImmediatePublishTab,
  tabToContentDomain,
} from '@/lib/storefront/storefront-publish-model';
import { STOREFRONT_STORE_PUBLIC_SELECT } from '@/lib/storefront/store-public-fields';
import { hasUnpublishedContentDraft } from '@/lib/storefront/store-content-publish';
import type { Store } from '@/hooks/useStores';
import { sanitizeStorePayload } from '@/lib/store-payload-utils';

describe('storefront publish model', () => {
  it('uses draft_and_publish for appearance and content tabs', () => {
    expect(getStorefrontPublishMode('appearance')).toBe('draft_and_publish');
    expect(getStorefrontPublishMode('seo')).toBe('draft_and_publish');
    expect(getStorefrontPublishMode('marketing')).toBe('draft_and_publish');
    expect(getStorefrontPublishMode('legal')).toBe('draft_and_publish');
    expect(isDraftAndPublishTab('seo')).toBe(true);
    expect(isImmediatePublishTab('appearance')).toBe(false);
  });

  it('uses immediate publish for settings tabs', () => {
    expect(getStorefrontPublishMode('settings')).toBe('immediate');
    expect(isImmediatePublishTab('analytics')).toBe(true);
  });

  it('maps tabs to content domains', () => {
    expect(tabToContentDomain('seo')).toBe('seo');
    expect(tabToContentDomain('appearance')).toBeNull();
  });
});

describe('store content drafts', () => {
  it('detects unpublished content drafts', () => {
    const store = {
      seo_draft: { meta_title: 'Draft' },
      marketing_content_draft: null,
      legal_pages_draft: null,
    } as Store;
    expect(hasUnpublishedContentDraft(store, 'seo')).toBe(true);
    expect(hasUnpublishedContentDraft(store, 'marketing')).toBe(false);
  });
});

describe('store payload sanitize', () => {
  it('allows SEO live columns and strips user_id', () => {
    const cleaned = sanitizeStorePayload({
      meta_title: 'Title',
      og_image: 'https://cdn.example/og.png',
      user_id: 'should-strip',
    });
    expect(cleaned.meta_title).toBe('Title');
    expect(cleaned.og_image).toBe('https://cdn.example/og.png');
    expect(cleaned).not.toHaveProperty('user_id');
  });
});

describe('store public fields', () => {
  it('does not expose custom tracking scripts on stores_public', () => {
    expect(STOREFRONT_STORE_PUBLIC_SELECT).not.toContain('custom_tracking_scripts');
    expect(STOREFRONT_STORE_PUBLIC_SELECT).not.toContain('custom_scripts_enabled');
  });

  it('does not expose content drafts on stores_public', () => {
    expect(STOREFRONT_STORE_PUBLIC_SELECT).not.toContain('seo_draft');
    expect(STOREFRONT_STORE_PUBLIC_SELECT).not.toContain('marketing_content_draft');
    expect(STOREFRONT_STORE_PUBLIC_SELECT).not.toContain('legal_pages_draft');
  });
});
