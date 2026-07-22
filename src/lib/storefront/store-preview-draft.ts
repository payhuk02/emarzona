/**
 * Brouillon de prévisualisation storefront (localStorage, synchronisé iframe ↔ wizard ↔ nouvel onglet).
 */

import type { Store } from '@/hooks/useStores';

export type StorePreviewDraft = Partial<
  Pick<
    Store,
    | 'name'
    | 'description'
    | 'logo_url'
    | 'banner_url'
    | 'favicon_url'
    | 'apple_touch_icon_url'
    | 'primary_color'
    | 'secondary_color'
    | 'accent_color'
    | 'background_color'
    | 'text_color'
    | 'text_secondary_color'
    | 'button_primary_color'
    | 'button_primary_text'
    | 'button_secondary_color'
    | 'button_secondary_text'
    | 'link_color'
    | 'link_hover_color'
    | 'border_radius'
    | 'shadow_intensity'
    | 'heading_font'
    | 'body_font'
    | 'font_size_base'
    | 'heading_size_h1'
    | 'heading_size_h2'
    | 'heading_size_h3'
    | 'line_height'
    | 'letter_spacing'
    | 'header_style'
    | 'footer_style'
    | 'sidebar_enabled'
    | 'sidebar_position'
    | 'product_grid_columns'
    | 'product_card_style'
    | 'navigation_style'
    | 'watermark_url'
    | 'placeholder_image_url'
  >
>;

export type StoreAppearanceFormDraft = {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  faviconUrl?: string | null;
  appleTouchIconUrl?: string | null;
  watermarkUrl?: string | null;
  placeholderImageUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  textSecondaryColor?: string;
  buttonPrimaryColor?: string;
  buttonPrimaryText?: string;
  buttonSecondaryColor?: string;
  buttonSecondaryText?: string;
  linkColor?: string;
  linkHoverColor?: string;
  borderRadius?: Store['border_radius'];
  shadowIntensity?: Store['shadow_intensity'];
  headingFont?: string;
  bodyFont?: string;
  fontSizeBase?: string;
  headingSizeH1?: string;
  headingSizeH2?: string;
  headingSizeH3?: string;
  lineHeight?: string;
  letterSpacing?: string;
  headerStyle?: Store['header_style'];
  footerStyle?: Store['footer_style'];
  sidebarEnabled?: boolean;
  sidebarPosition?: Store['sidebar_position'];
  productGridColumns?: number;
  productCardStyle?: Store['product_card_style'];
  navigationStyle?: Store['navigation_style'];
};

const draftKey = (storeId: string) => `emarzona:store-preview:${storeId}`;

export function buildStorePreviewUrl(storeId: string, slug: string): string {
  const params = new URLSearchParams({
    storeId,
    slug,
  });
  return `/store-preview?${params.toString()}`;
}

function readDraftFromStorage(storage: Storage, storeId: string): StorePreviewDraft | null {
  try {
    const raw = storage.getItem(draftKey(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorePreviewDraft & { _updatedAt?: number };
    const { _updatedAt: _ignored, ...draft } = parsed;
    return draft;
  } catch {
    return null;
  }
}

export function appearanceFormToPreviewDraft(form: StoreAppearanceFormDraft): StorePreviewDraft {
  return {
    logo_url: form.logoUrl || null,
    banner_url: form.bannerUrl || null,
    favicon_url: form.faviconUrl || null,
    apple_touch_icon_url: form.appleTouchIconUrl || null,
    primary_color: form.primaryColor || null,
    secondary_color: form.secondaryColor || null,
    accent_color: form.accentColor || null,
    background_color: form.backgroundColor || null,
    text_color: form.textColor || null,
    text_secondary_color: form.textSecondaryColor || null,
    button_primary_color: form.buttonPrimaryColor || null,
    button_primary_text: form.buttonPrimaryText || null,
    button_secondary_color: form.buttonSecondaryColor || null,
    button_secondary_text: form.buttonSecondaryText || null,
    link_color: form.linkColor || null,
    link_hover_color: form.linkHoverColor || null,
    border_radius: form.borderRadius ?? null,
    shadow_intensity: form.shadowIntensity ?? null,
    heading_font: form.headingFont || null,
    body_font: form.bodyFont || null,
    font_size_base: form.fontSizeBase || null,
    heading_size_h1: form.headingSizeH1 || null,
    heading_size_h2: form.headingSizeH2 || null,
    heading_size_h3: form.headingSizeH3 || null,
    line_height: form.lineHeight || null,
    letter_spacing: form.letterSpacing || null,
    header_style: form.headerStyle ?? null,
    footer_style: form.footerStyle ?? null,
    sidebar_enabled: form.sidebarEnabled ?? null,
    sidebar_position: form.sidebarPosition ?? null,
    product_grid_columns: form.productGridColumns ?? null,
    product_card_style: form.productCardStyle ?? null,
    navigation_style: form.navigationStyle ?? null,
    watermark_url: form.watermarkUrl || null,
    placeholder_image_url: form.placeholderImageUrl || null,
  };
}

const APPEARANCE_DRAFT_FIELDS: Array<keyof StorePreviewDraft> = [
  'logo_url',
  'banner_url',
  'favicon_url',
  'apple_touch_icon_url',
  'watermark_url',
  'placeholder_image_url',
  'primary_color',
  'secondary_color',
  'accent_color',
  'background_color',
  'text_color',
  'text_secondary_color',
  'button_primary_color',
  'button_primary_text',
  'button_secondary_color',
  'button_secondary_text',
  'link_color',
  'link_hover_color',
  'border_radius',
  'shadow_intensity',
  'heading_font',
  'body_font',
  'font_size_base',
  'heading_size_h1',
  'heading_size_h2',
  'heading_size_h3',
  'line_height',
  'letter_spacing',
  'header_style',
  'footer_style',
  'sidebar_enabled',
  'sidebar_position',
  'product_grid_columns',
  'product_card_style',
  'navigation_style',
];

function normalizeDraftValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
}

/** True when appearance form differs from saved store (preview ≠ published). */
export function hasAppearanceDraftChanges(store: Store, form: StoreAppearanceFormDraft): boolean {
  const draft = appearanceFormToPreviewDraft(form);
  return APPEARANCE_DRAFT_FIELDS.some(field => {
    const saved = normalizeDraftValue(store[field as keyof Store]);
    const pending = normalizeDraftValue(draft[field]);
    return saved !== pending;
  });
}

/** Brouillon local ou appearance_draft en base = non publié. */
export function hasUnpublishedAppearance(store: Store, form: StoreAppearanceFormDraft): boolean {
  if (store.appearance_draft && typeof store.appearance_draft === 'object') {
    return true;
  }
  return hasAppearanceDraftChanges(store, form);
}

export const STORE_PREVIEW_CHANNEL = 'emarzona-store-preview';

export function writeStorePreviewDraft(storeId: string, draft: StorePreviewDraft): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(draftKey(storeId), JSON.stringify({ ...draft, _updatedAt: Date.now() }));
  try {
    sessionStorage.removeItem(draftKey(storeId));
  } catch {
    // ignore
  }
  try {
    const channel = new BroadcastChannel(STORE_PREVIEW_CHANNEL);
    channel.postMessage({ type: 'draft-updated', storeId });
    channel.close();
  } catch {
    // BroadcastChannel unsupported — storage event / remount fallback
  }
}

export function readStorePreviewDraft(storeId: string): StorePreviewDraft | null {
  if (typeof window === 'undefined') return null;

  const fromLocal = readDraftFromStorage(localStorage, storeId);
  if (fromLocal) return fromLocal;

  const legacySession = readDraftFromStorage(sessionStorage, storeId);
  if (legacySession) {
    writeStorePreviewDraft(storeId, legacySession);
    return legacySession;
  }

  return null;
}

export function mergeStorePreviewDraft(store: Store, draft: StorePreviewDraft | null): Store {
  if (!draft) return store;
  return { ...store, ...draft } as Store;
}
