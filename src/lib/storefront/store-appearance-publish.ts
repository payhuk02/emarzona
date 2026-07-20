/**
 * Brouillon / publication apparence boutique (colonnes appearance_draft + RPC publish).
 */

import { supabase } from '@/integrations/supabase/client';
import type { Store } from '@/hooks/useStores';
import type { StoreAppearanceFormDraft } from '@/lib/storefront/store-preview-draft';
import { appearanceFormToPreviewDraft } from '@/lib/storefront/store-preview-draft';

export type StoreAppearanceDraftRecord = StoreAppearanceFormDraft & Record<string, unknown>;

export function appearanceFormToDraftRecord(
  form: StoreAppearanceFormDraft
): StoreAppearanceDraftRecord {
  return appearanceFormToPreviewDraft(form) as StoreAppearanceDraftRecord;
}

export function mergeStoreAppearanceDraft(
  store: Store,
  draft: StoreAppearanceDraftRecord | null | undefined
): Store {
  if (!draft || typeof draft !== 'object') return store;
  return { ...store, ...draft } as Store;
}

export function getStoreAppearanceDraft(store: Store): StoreAppearanceDraftRecord | null {
  const raw = (store as Store & { appearance_draft?: unknown }).appearance_draft;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as StoreAppearanceDraftRecord;
}

export function draftRecordToAppearanceForm(
  draft: StoreAppearanceDraftRecord
): StoreAppearanceFormDraft {
  return {
    logoUrl: draft.logo_url ?? null,
    bannerUrl: draft.banner_url ?? null,
    faviconUrl: draft.favicon_url ?? null,
    appleTouchIconUrl: draft.apple_touch_icon_url ?? null,
    watermarkUrl: draft.watermark_url ?? null,
    placeholderImageUrl: draft.placeholder_image_url ?? null,
    primaryColor: draft.primary_color ?? undefined,
    secondaryColor: draft.secondary_color ?? undefined,
    accentColor: draft.accent_color ?? undefined,
    backgroundColor: draft.background_color ?? undefined,
    textColor: draft.text_color ?? undefined,
    textSecondaryColor: draft.text_secondary_color ?? undefined,
    buttonPrimaryColor: draft.button_primary_color ?? undefined,
    buttonPrimaryText: draft.button_primary_text ?? undefined,
    buttonSecondaryColor: draft.button_secondary_color ?? undefined,
    buttonSecondaryText: draft.button_secondary_text ?? undefined,
    linkColor: draft.link_color ?? undefined,
    linkHoverColor: draft.link_hover_color ?? undefined,
    borderRadius: draft.border_radius ?? undefined,
    shadowIntensity: draft.shadow_intensity ?? undefined,
    headingFont: draft.heading_font ?? undefined,
    bodyFont: draft.body_font ?? undefined,
    fontSizeBase: draft.font_size_base ?? undefined,
    headingSizeH1: draft.heading_size_h1 ?? undefined,
    headingSizeH2: draft.heading_size_h2 ?? undefined,
    headingSizeH3: draft.heading_size_h3 ?? undefined,
    lineHeight: draft.line_height ?? undefined,
    letterSpacing: draft.letter_spacing ?? undefined,
    headerStyle: draft.header_style ?? undefined,
    footerStyle: draft.footer_style ?? undefined,
    sidebarEnabled: draft.sidebar_enabled ?? undefined,
    sidebarPosition: draft.sidebar_position ?? undefined,
    productGridColumns: draft.product_grid_columns ?? undefined,
    productCardStyle: draft.product_card_style ?? undefined,
    navigationStyle: draft.navigation_style ?? undefined,
  };
}

export async function saveStoreAppearanceDraft(
  storeId: string,
  form: StoreAppearanceFormDraft
): Promise<void> {
  const draft = appearanceFormToDraftRecord(form);
  const { error } = await supabase.rpc('save_store_appearance_draft', {
    p_store_id: storeId,
    p_draft: draft as never,
  });

  if (error) {
    // Fallback si migration pas encore déployée
    const { error: legacyError } = await supabase
      .from('stores')
      .update({ appearance_draft: draft as never })
      .eq('id', storeId);

    if (legacyError) throw legacyError;
    return;
  }
}

export async function publishStoreAppearance(storeId: string): Promise<Store> {
  const { data, error } = await supabase.rpc('publish_store_appearance', {
    p_store_id: storeId,
  });

  if (error) throw error;
  return data as Store;
}
