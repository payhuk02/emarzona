/**
 * Modèle de publication storefront par onglet du wizard de personnalisation.
 * Apparence = brouillon + publication ; les autres onglets = effet immédiat.
 */

import type { StoreCustomizationStepKey } from '@/lib/commerce/store-customization-steps';

export type StorefrontPublishMode = 'draft_and_publish' | 'immediate';

const IMMEDIATE_PUBLISH_TABS = new Set<StoreCustomizationStepKey>([
  'settings',
  'location',
  'seo',
  'legal',
  'url',
  'marketing',
  'analytics',
  'commerce',
  'notifications',
]);

/** Onglets dont les changements sont visibles immédiatement sur la vitrine publique. */
export function getStorefrontPublishMode(tab: string): StorefrontPublishMode {
  if (tab === 'appearance') {
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
