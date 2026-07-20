/**
 * Modèle de publication storefront par onglet du wizard de personnalisation.
 * Apparence / SEO / marketing / legal = brouillon + publication ; le reste = immédiat.
 */

import type { StoreCustomizationStepKey } from '@/lib/commerce/store-customization-steps';
import type { StoreContentDomain } from '@/lib/storefront/store-content-publish';

export type StorefrontPublishMode = 'draft_and_publish' | 'immediate';

const DRAFT_AND_PUBLISH_TABS = new Set<StoreCustomizationStepKey>([
  'appearance',
  'seo',
  'legal',
  'marketing',
]);

const IMMEDIATE_PUBLISH_TABS = new Set<StoreCustomizationStepKey>([
  'settings',
  'location',
  'url',
  'analytics',
  'commerce',
  'notifications',
]);

/** Onglets dont les changements sont visibles immédiatement sur la vitrine publique. */
export function getStorefrontPublishMode(tab: string): StorefrontPublishMode {
  if (DRAFT_AND_PUBLISH_TABS.has(tab as StoreCustomizationStepKey)) {
    return 'draft_and_publish';
  }
  if (IMMEDIATE_PUBLISH_TABS.has(tab as StoreCustomizationStepKey)) {
    return 'immediate';
  }
  return 'immediate';
}

export function isDraftAndPublishTab(tab: string): boolean {
  return getStorefrontPublishMode(tab) === 'draft_and_publish';
}

export function isImmediatePublishTab(tab: string): boolean {
  return getStorefrontPublishMode(tab) === 'immediate';
}

export function tabToContentDomain(tab: string): StoreContentDomain | null {
  if (tab === 'seo' || tab === 'marketing' || tab === 'legal') return tab;
  return null;
}
