/**
 * Fusionne une ligne `stores` + relation `store_appearance` en objet Store plat.
 * Utilisé après extraction des colonnes apparence hors de `stores`.
 */

export type StoreAppearanceRelation = {
  logo_url?: string | null;
  banner_url?: string | null;
  favicon_url?: string | null;
  apple_touch_icon_url?: string | null;
  watermark_url?: string | null;
  placeholder_image_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  text_secondary_color?: string | null;
  button_primary_color?: string | null;
  button_primary_text?: string | null;
  button_secondary_color?: string | null;
  button_secondary_text?: string | null;
  link_color?: string | null;
  link_hover_color?: string | null;
  border_radius?: string | null;
  shadow_intensity?: string | null;
  heading_font?: string | null;
  body_font?: string | null;
  font_size_base?: string | null;
  heading_size_h1?: string | null;
  heading_size_h2?: string | null;
  heading_size_h3?: string | null;
  line_height?: string | null;
  letter_spacing?: string | null;
  header_style?: string | null;
  footer_style?: string | null;
  sidebar_enabled?: boolean | null;
  sidebar_position?: string | null;
  product_grid_columns?: number | null;
  product_card_style?: string | null;
  navigation_style?: string | null;
  appearance_draft?: Record<string, unknown> | null;
  appearance_published_at?: string | null;
};

type RowWithAppearance = Record<string, unknown> & {
  store_appearance?: StoreAppearanceRelation | StoreAppearanceRelation[] | null;
};

function pickAppearance(row: RowWithAppearance): StoreAppearanceRelation | null {
  const raw = row.store_appearance;
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

/** SELECT Supabase pour jointure apparence dashboard. */
export const STORE_APPEARANCE_EMBED_SELECT = `store_appearance (
  logo_url,
  banner_url,
  favicon_url,
  apple_touch_icon_url,
  watermark_url,
  placeholder_image_url,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  text_secondary_color,
  button_primary_color,
  button_primary_text,
  button_secondary_color,
  button_secondary_text,
  link_color,
  link_hover_color,
  border_radius,
  shadow_intensity,
  heading_font,
  body_font,
  font_size_base,
  heading_size_h1,
  heading_size_h2,
  heading_size_h3,
  line_height,
  letter_spacing,
  header_style,
  footer_style,
  sidebar_enabled,
  sidebar_position,
  product_grid_columns,
  product_card_style,
  navigation_style,
  appearance_draft,
  appearance_published_at
)`;

export function flattenStoreWithAppearance<T extends RowWithAppearance>(
  row: T
): Omit<T, 'store_appearance'> {
  const appearance = pickAppearance(row);
  const { store_appearance: _nested, ...store } = row;

  if (!appearance) {
    return store as Omit<T, 'store_appearance'>;
  }

  return {
    ...store,
    logo_url: appearance.logo_url ?? store.logo_url,
    banner_url: appearance.banner_url ?? store.banner_url,
    favicon_url: appearance.favicon_url ?? store.favicon_url,
    apple_touch_icon_url: appearance.apple_touch_icon_url ?? store.apple_touch_icon_url,
    watermark_url: appearance.watermark_url ?? store.watermark_url,
    placeholder_image_url: appearance.placeholder_image_url ?? store.placeholder_image_url,
    primary_color: appearance.primary_color ?? store.primary_color,
    secondary_color: appearance.secondary_color ?? store.secondary_color,
    accent_color: appearance.accent_color ?? store.accent_color,
    background_color: appearance.background_color ?? store.background_color,
    text_color: appearance.text_color ?? store.text_color,
    text_secondary_color: appearance.text_secondary_color ?? store.text_secondary_color,
    button_primary_color: appearance.button_primary_color ?? store.button_primary_color,
    button_primary_text: appearance.button_primary_text ?? store.button_primary_text,
    button_secondary_color: appearance.button_secondary_color ?? store.button_secondary_color,
    button_secondary_text: appearance.button_secondary_text ?? store.button_secondary_text,
    link_color: appearance.link_color ?? store.link_color,
    link_hover_color: appearance.link_hover_color ?? store.link_hover_color,
    border_radius: appearance.border_radius ?? store.border_radius,
    shadow_intensity: appearance.shadow_intensity ?? store.shadow_intensity,
    heading_font: appearance.heading_font ?? store.heading_font,
    body_font: appearance.body_font ?? store.body_font,
    font_size_base: appearance.font_size_base ?? store.font_size_base,
    heading_size_h1: appearance.heading_size_h1 ?? store.heading_size_h1,
    heading_size_h2: appearance.heading_size_h2 ?? store.heading_size_h2,
    heading_size_h3: appearance.heading_size_h3 ?? store.heading_size_h3,
    line_height: appearance.line_height ?? store.line_height,
    letter_spacing: appearance.letter_spacing ?? store.letter_spacing,
    header_style: appearance.header_style ?? store.header_style,
    footer_style: appearance.footer_style ?? store.footer_style,
    sidebar_enabled: appearance.sidebar_enabled ?? store.sidebar_enabled,
    sidebar_position: appearance.sidebar_position ?? store.sidebar_position,
    product_grid_columns: appearance.product_grid_columns ?? store.product_grid_columns,
    product_card_style: appearance.product_card_style ?? store.product_card_style,
    navigation_style: appearance.navigation_style ?? store.navigation_style,
    appearance_draft: appearance.appearance_draft ?? store.appearance_draft,
    appearance_published_at: appearance.appearance_published_at ?? store.appearance_published_at,
  } as Omit<T, 'store_appearance'>;
}
