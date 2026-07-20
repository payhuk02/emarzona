import { describe, expect, it } from 'vitest';
import {
  isMarketingContentMeaningful,
  buildAppearanceQualityChecks,
  buildMarketingQualityChecks,
  isAppearanceStepComplete,
} from '@/lib/storefront/store-quality-checklist';
import type { Store } from '@/hooks/useStores';
import {
  shouldRedirectCollectionToTenant,
  buildTenantCollectionUrl,
} from '@/lib/storefront/collection-tenant-redirect';
import { fallbackStoreQuota } from '@/lib/billing/user-store-quota';

describe('store quality checklist', () => {
  it('rejects empty marketing objects', () => {
    expect(isMarketingContentMeaningful({})).toBe(false);
    expect(isMarketingContentMeaningful({ welcome_message: 'Hi' })).toBe(false);
  });

  it('accepts meaningful marketing copy', () => {
    expect(
      isMarketingContentMeaningful({
        welcome_message: 'Bienvenue dans notre boutique artisanale depuis 2010.',
      })
    ).toBe(true);
  });

  it('requires logo and contrast for appearance step', () => {
    const incomplete = {
      logo_url: null,
      primary_color: '#111',
      background_color: '#fff',
      text_color: '#111',
    } as Store;
    expect(isAppearanceStepComplete(incomplete)).toBe(false);

    const complete = {
      logo_url: 'https://cdn.example/logo.png',
      primary_color: '#111111',
      background_color: '#ffffff',
      text_color: '#111111',
    } as Store;
    expect(isAppearanceStepComplete(complete)).toBe(true);
  });

  it('flags missing logo in quality checks', () => {
    const checks = buildAppearanceQualityChecks({
      logoUrl: '',
      textColor: '#111111',
      backgroundColor: '#ffffff',
      buttonPrimaryColor: '#111111',
      buttonPrimaryText: '#ffffff',
      linkColor: '#111111',
    });
    expect(checks.find(c => c.id === 'logo')?.ok).toBe(false);
    expect(checks.find(c => c.id === 'textContrast')?.ok).toBe(true);
  });
  it('flags missing marketing welcome in quality checks', () => {
    const empty = buildMarketingQualityChecks({});
    expect(empty.find(c => c.id === 'welcome')?.ok).toBe(false);

    const filled = buildMarketingQualityChecks({
      welcome_message: 'Bienvenue dans notre boutique artisanale depuis 2010.',
      mission_statement: 'Créer des objets durables et beaux pour le quotidien.',
    });
    expect(filled.find(c => c.id === 'welcome')?.ok).toBe(true);
    expect(filled.find(c => c.id === 'missionOrStory')?.ok).toBe(true);
  });
});

describe('collection tenant redirect', () => {
  it('redirects apex marketplace URLs with store query', () => {
    expect(
      shouldRedirectCollectionToTenant({
        storeSlugFromQuery: 'atelier',
        collectionSlug: 'summer',
        hostname: 'www.emarzona.com',
      })
    ).toBe(true);
  });

  it('does not redirect on tenant host', () => {
    expect(
      shouldRedirectCollectionToTenant({
        storeSlugFromQuery: 'atelier',
        collectionSlug: 'summer',
        hostname: 'atelier.myemarzona.shop',
      })
    ).toBe(false);
  });

  it('builds tenant collection URL', () => {
    expect(
      buildTenantCollectionUrl({
        storeSlug: 'atelier',
        collectionSlug: 'summer',
      })
    ).toBe('https://atelier.myemarzona.shop/collections/summer');
  });
});

describe('user store quota fallback', () => {
  it('uses free default of 3', () => {
    const quota = fallbackStoreQuota(2);
    expect(quota.max_stores).toBe(3);
    expect(quota.can_create).toBe(true);
    expect(fallbackStoreQuota(3).can_create).toBe(false);
  });
});
