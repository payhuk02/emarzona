/**
 * État formulaire apparence partagé (useStoreFormState + future reducer migration).
 */

import type { Store } from '@/hooks/useStores';
import type { ExtendedStore, StoreFormState } from '@/components/store/types/store-form';
import type { StoreAppearanceFormDraft } from '@/lib/storefront/store-preview-draft';
import {
  appearanceFormToPreviewDraft,
  hasAppearanceDraftChanges,
} from '@/lib/storefront/store-preview-draft';
import { getStoreAppearanceDraft } from '@/lib/storefront/store-appearance-publish';

export function appearanceFormFromState(state: StoreFormState): StoreAppearanceFormDraft {
  return {
    logoUrl: state.logoUrl,
    bannerUrl: state.bannerUrl,
    faviconUrl: state.faviconUrl,
    appleTouchIconUrl: state.appleTouchIconUrl,
    watermarkUrl: state.watermarkUrl,
    placeholderImageUrl: state.placeholderImageUrl,
    primaryColor: state.primaryColor,
    secondaryColor: state.secondaryColor,
    accentColor: state.accentColor,
    backgroundColor: state.backgroundColor,
    textColor: state.textColor,
    textSecondaryColor: state.textSecondaryColor,
    buttonPrimaryColor: state.buttonPrimaryColor,
    buttonPrimaryText: state.buttonPrimaryText,
    buttonSecondaryColor: state.buttonSecondaryColor,
    buttonSecondaryText: state.buttonSecondaryText,
    linkColor: state.linkColor,
    linkHoverColor: state.linkHoverColor,
    borderRadius: state.borderRadius,
    shadowIntensity: state.shadowIntensity,
    headingFont: state.headingFont,
    bodyFont: state.bodyFont,
    fontSizeBase: state.fontSizeBase,
    headingSizeH1: state.headingSizeH1,
    headingSizeH2: state.headingSizeH2,
    headingSizeH3: state.headingSizeH3,
    lineHeight: state.lineHeight,
    letterSpacing: state.letterSpacing,
    headerStyle: state.headerStyle,
    footerStyle: state.footerStyle,
    sidebarEnabled: state.sidebarEnabled,
    sidebarPosition: state.sidebarPosition,
    productGridColumns: state.productGridColumns,
    productCardStyle: state.productCardStyle,
    navigationStyle: state.navigationStyle,
  };
}

/** Baseline publiée sans fusionner appearance_draft (store list partielle OK). */
export function publishedAppearanceBaselineFromStore(
  store: ExtendedStore
): StoreAppearanceFormDraft {
  const withoutDraft = { ...store, appearance_draft: null } as ExtendedStore;
  return {
    logoUrl: withoutDraft.logo_url || '',
    bannerUrl: withoutDraft.banner_url || '',
    faviconUrl: withoutDraft.favicon_url || '',
    appleTouchIconUrl: withoutDraft.apple_touch_icon_url || '',
    watermarkUrl: withoutDraft.watermark_url || '',
    placeholderImageUrl: withoutDraft.placeholder_image_url || '',
    primaryColor: withoutDraft.primary_color || '#3b82f6',
    secondaryColor: withoutDraft.secondary_color || '#8b5cf6',
    accentColor: withoutDraft.accent_color || '#f59e0b',
    backgroundColor: withoutDraft.background_color || '#ffffff',
    textColor: withoutDraft.text_color || '#1f2937',
    textSecondaryColor: withoutDraft.text_secondary_color || '#6b7280',
    buttonPrimaryColor: withoutDraft.button_primary_color || '#3b82f6',
    buttonPrimaryText: withoutDraft.button_primary_text || '#ffffff',
    buttonSecondaryColor: withoutDraft.button_secondary_color || '#e5e7eb',
    buttonSecondaryText: withoutDraft.button_secondary_text || '#1f2937',
    linkColor: withoutDraft.link_color || '#3b82f6',
    linkHoverColor: withoutDraft.link_hover_color || '#2563eb',
    borderRadius: withoutDraft.border_radius || 'md',
    shadowIntensity: withoutDraft.shadow_intensity || 'md',
    headingFont: withoutDraft.heading_font || 'Inter',
    bodyFont: withoutDraft.body_font || 'Inter',
    fontSizeBase: withoutDraft.font_size_base || '16px',
    headingSizeH1: withoutDraft.heading_size_h1 || '2.5rem',
    headingSizeH2: withoutDraft.heading_size_h2 || '2rem',
    headingSizeH3: withoutDraft.heading_size_h3 || '1.5rem',
    lineHeight: withoutDraft.line_height || '1.6',
    letterSpacing: withoutDraft.letter_spacing || 'normal',
    headerStyle: withoutDraft.header_style || 'standard',
    footerStyle: withoutDraft.footer_style || 'standard',
    sidebarEnabled: withoutDraft.sidebar_enabled || false,
    sidebarPosition: withoutDraft.sidebar_position || 'left',
    productGridColumns: withoutDraft.product_grid_columns || 3,
    productCardStyle: withoutDraft.product_card_style || 'standard',
    navigationStyle: withoutDraft.navigation_style || 'horizontal',
  };
}

export function computeHasUnpublishedAppearanceDraft(params: {
  store: Store;
  form: StoreAppearanceFormDraft;
  hasRemoteDraft: boolean;
  publishedBaseline: StoreAppearanceFormDraft | null;
}): boolean {
  const { store, form, hasRemoteDraft, publishedBaseline } = params;

  if (hasRemoteDraft) return true;
  if (getStoreAppearanceDraft(store)) return true;
  if (store.appearance_draft && typeof store.appearance_draft === 'object') return true;

  const baseline = publishedBaseline;
  if (!baseline) {
    return hasAppearanceDraftChanges(store, form);
  }

  const baselineStore = {
    ...store,
    ...appearanceFormToPreviewDraft(baseline),
  } as Store;

  return hasAppearanceDraftChanges(baselineStore, form);
}

export function initialHasRemoteAppearanceDraft(store: Store): boolean {
  return Boolean(getStoreAppearanceDraft(store));
}

export function initialPublishedAppearanceBaseline(
  store: ExtendedStore
): StoreAppearanceFormDraft | null {
  return getStoreAppearanceDraft(store) ? null : publishedAppearanceBaselineFromStore(store);
}
