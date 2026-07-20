/**
 * État formulaire apparence partagé (useStoreFormState + future reducer migration).
 */

import type { Store, StoreLegalPages, StoreMarketingContent } from '@/hooks/useStores';
import type { ExtendedStore, StoreFormState } from '@/components/store/types/store-form';
import type { StoreAppearanceFormDraft } from '@/lib/storefront/store-preview-draft';
import {
  appearanceFormToPreviewDraft,
  hasAppearanceDraftChanges,
} from '@/lib/storefront/store-preview-draft';
import {
  draftRecordToAppearanceForm,
  getStoreAppearanceDraft,
} from '@/lib/storefront/store-appearance-publish';

const DEFAULT_LEGAL_PAGES: StoreLegalPages = {
  terms_of_service: '',
  privacy_policy: '',
  return_policy: '',
  shipping_policy: '',
  refund_policy: '',
  cookie_policy: '',
  disclaimer: '',
  faq_content: '',
};

/** État formulaire initial depuis la boutique (+ fusion appearance_draft). */
export function initStoreFormState(store: ExtendedStore): StoreFormState {
  const base: StoreFormState = {
    name: store.name,
    description: store.description || '',
    logoUrl: store.logo_url || '',
    bannerUrl: store.banner_url || '',
    faviconUrl: store.favicon_url || '',
    appleTouchIconUrl: store.apple_touch_icon_url || '',
    watermarkUrl: store.watermark_url || '',
    placeholderImageUrl: store.placeholder_image_url || '',
    about: store.about || '',
    contactEmail: store.contact_email || '',
    contactPhone: store.contact_phone || '',
    facebookUrl: store.facebook_url || '',
    instagramUrl: store.instagram_url || '',
    twitterUrl: store.twitter_url || '',
    linkedinUrl: store.linkedin_url || '',
    youtubeUrl: store.youtube_url || '',
    tiktokUrl: store.tiktok_url || '',
    pinterestUrl: store.pinterest_url || '',
    snapchatUrl: store.snapchat_url || '',
    discordUrl: store.discord_url || '',
    twitchUrl: store.twitch_url || '',
    supportEmail: store.support_email || '',
    salesEmail: store.sales_email || '',
    pressEmail: store.press_email || '',
    partnershipEmail: store.partnership_email || '',
    supportPhone: store.support_phone || '',
    salesPhone: store.sales_phone || '',
    whatsappNumber: store.whatsapp_number || '',
    telegramUsername: store.telegram_username || '',
    infoMessage: store.info_message || '',
    infoMessageColor: store.info_message_color || '#3b82f6',
    infoMessageFont: store.info_message_font || 'Inter',
    primaryColor: store.primary_color || '#3b82f6',
    secondaryColor: store.secondary_color || '#8b5cf6',
    accentColor: store.accent_color || '#f59e0b',
    backgroundColor: store.background_color || '#ffffff',
    textColor: store.text_color || '#1f2937',
    textSecondaryColor: store.text_secondary_color || '#6b7280',
    buttonPrimaryColor: store.button_primary_color || '#3b82f6',
    buttonPrimaryText: store.button_primary_text || '#ffffff',
    buttonSecondaryColor: store.button_secondary_color || '#e5e7eb',
    buttonSecondaryText: store.button_secondary_text || '#1f2937',
    linkColor: store.link_color || '#3b82f6',
    linkHoverColor: store.link_hover_color || '#2563eb',
    borderRadius: store.border_radius || 'md',
    shadowIntensity: store.shadow_intensity || 'md',
    headingFont: store.heading_font || 'Inter',
    bodyFont: store.body_font || 'Inter',
    fontSizeBase: store.font_size_base || '16px',
    headingSizeH1: store.heading_size_h1 || '2.5rem',
    headingSizeH2: store.heading_size_h2 || '2rem',
    headingSizeH3: store.heading_size_h3 || '1.5rem',
    lineHeight: store.line_height || '1.6',
    letterSpacing: store.letter_spacing || 'normal',
    headerStyle: store.header_style || 'standard',
    footerStyle: store.footer_style || 'standard',
    sidebarEnabled: store.sidebar_enabled || false,
    sidebarPosition: store.sidebar_position || 'left',
    productGridColumns: store.product_grid_columns || 3,
    productCardStyle: store.product_card_style || 'standard',
    navigationStyle: store.navigation_style || 'horizontal',
    metaTitle: store.meta_title || '',
    metaDescription: store.meta_description || '',
    metaKeywords: store.meta_keywords || '',
    ogTitle: store.og_title || '',
    ogDescription: store.og_description || '',
    ogImageUrl: store.og_image || '',
    addressLine1: store.address_line1 || '',
    addressLine2: store.address_line2 || '',
    city: store.city || '',
    stateProvince: store.state_province || '',
    postalCode: store.postal_code || '',
    country: store.country || '',
    latitude: store.latitude || null,
    longitude: store.longitude || null,
    timezone: store.timezone || 'Africa/Ouagadougou',
    openingHours: store.opening_hours || null,
    legalPages: store.legal_pages || DEFAULT_LEGAL_PAGES,
    marketingContent: store.marketing_content || null,
    googleAnalyticsId: store.google_analytics_id || '',
    googleAnalyticsEnabled: store.google_analytics_enabled || false,
    facebookPixelId: store.facebook_pixel_id || '',
    facebookPixelEnabled: store.facebook_pixel_enabled || false,
    googleTagManagerId: store.google_tag_manager_id || '',
    googleTagManagerEnabled: store.google_tag_manager_enabled || false,
    tiktokPixelId: store.tiktok_pixel_id || '',
    tiktokPixelEnabled: store.tiktok_pixel_enabled || false,
    customTrackingScripts: store.custom_tracking_scripts || '',
    customScriptsEnabled: store.custom_scripts_enabled || false,
  };

  const draft = getStoreAppearanceDraft(store);
  if (!draft) return base;

  const form = draftRecordToAppearanceForm(draft);
  return {
    ...base,
    logoUrl: form.logoUrl ?? base.logoUrl,
    bannerUrl: form.bannerUrl ?? base.bannerUrl,
    faviconUrl: form.faviconUrl ?? base.faviconUrl,
    appleTouchIconUrl: form.appleTouchIconUrl ?? base.appleTouchIconUrl,
    watermarkUrl: form.watermarkUrl ?? base.watermarkUrl,
    placeholderImageUrl: form.placeholderImageUrl ?? base.placeholderImageUrl,
    primaryColor: form.primaryColor ?? base.primaryColor,
    secondaryColor: form.secondaryColor ?? base.secondaryColor,
    accentColor: form.accentColor ?? base.accentColor,
    backgroundColor: form.backgroundColor ?? base.backgroundColor,
    textColor: form.textColor ?? base.textColor,
    textSecondaryColor: form.textSecondaryColor ?? base.textSecondaryColor,
    buttonPrimaryColor: form.buttonPrimaryColor ?? base.buttonPrimaryColor,
    buttonPrimaryText: form.buttonPrimaryText ?? base.buttonPrimaryText,
    buttonSecondaryColor: form.buttonSecondaryColor ?? base.buttonSecondaryColor,
    buttonSecondaryText: form.buttonSecondaryText ?? base.buttonSecondaryText,
    linkColor: form.linkColor ?? base.linkColor,
    linkHoverColor: form.linkHoverColor ?? base.linkHoverColor,
    borderRadius: form.borderRadius ?? base.borderRadius,
    shadowIntensity: form.shadowIntensity ?? base.shadowIntensity,
    headingFont: form.headingFont ?? base.headingFont,
    bodyFont: form.bodyFont ?? base.bodyFont,
    fontSizeBase: form.fontSizeBase ?? base.fontSizeBase,
    headingSizeH1: form.headingSizeH1 ?? base.headingSizeH1,
    headingSizeH2: form.headingSizeH2 ?? base.headingSizeH2,
    headingSizeH3: form.headingSizeH3 ?? base.headingSizeH3,
    lineHeight: form.lineHeight ?? base.lineHeight,
    letterSpacing: form.letterSpacing ?? base.letterSpacing,
    headerStyle: form.headerStyle ?? base.headerStyle,
    footerStyle: form.footerStyle ?? base.footerStyle,
    sidebarEnabled: form.sidebarEnabled ?? base.sidebarEnabled,
    sidebarPosition: form.sidebarPosition ?? base.sidebarPosition,
    productGridColumns: form.productGridColumns ?? base.productGridColumns,
    productCardStyle: form.productCardStyle ?? base.productCardStyle,
    navigationStyle: form.navigationStyle ?? base.navigationStyle,
  };
}

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
