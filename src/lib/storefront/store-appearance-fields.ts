import type { Store } from '@/hooks/useStores';

/** Colonnes apparence publiées sur le storefront (≠ brouillon appearance_draft). */
export const STORE_APPEARANCE_PUBLISHED_KEYS = [
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
] as const satisfies readonly (keyof Store)[];

export type StoreAppearancePublishedKey = (typeof STORE_APPEARANCE_PUBLISHED_KEYS)[number];

export function omitAppearanceFromStoreUpdates<T extends Record<string, unknown>>(
  updates: T
): Omit<T, StoreAppearancePublishedKey> {
  const result = { ...updates };
  for (const key of STORE_APPEARANCE_PUBLISHED_KEYS) {
    delete result[key];
  }
  delete result.appearance_draft;
  delete result.appearance_published_at;
  return result as Omit<T, StoreAppearancePublishedKey>;
}

export function extractAppearancePayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const appearance: Record<string, unknown> = {};
  for (const key of STORE_APPEARANCE_PUBLISHED_KEYS) {
    if (payload[key] !== undefined) {
      appearance[key] = payload[key];
    }
  }
  if (payload.appearance_draft !== undefined) {
    appearance.appearance_draft = payload.appearance_draft;
  }
  if (payload.appearance_published_at !== undefined) {
    appearance.appearance_published_at = payload.appearance_published_at;
  }
  return appearance;
}
