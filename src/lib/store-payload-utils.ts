/**
 * Champs autorisés en écriture sur public.stores (aligné migrations déployées).
 * Évite les PATCH 400 quand la prod n'a pas encore toutes les colonnes du schéma TypeScript.
 */
const STORE_WRITABLE_COLUMNS = new Set([
  'name',
  'slug',
  'description',
  'about',
  'logo_url',
  'banner_url',
  'favicon_url',
  'apple_touch_icon_url',
  'watermark_url',
  'placeholder_image_url',
  'info_message',
  'info_message_color',
  'info_message_font',
  'contact_email',
  'contact_phone',
  'facebook_url',
  'instagram_url',
  'twitter_url',
  'linkedin_url',
  'youtube_url',
  'tiktok_url',
  'pinterest_url',
  'snapchat_url',
  'discord_url',
  'twitch_url',
  'support_email',
  'sales_email',
  'press_email',
  'partnership_email',
  'support_phone',
  'sales_phone',
  'whatsapp_number',
  'telegram_username',
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
  'address_line1',
  'address_line2',
  'city',
  'state_province',
  'postal_code',
  'country',
  'latitude',
  'longitude',
  'timezone',
  'opening_hours',
  'legal_pages',
  'marketing_content',
  'google_analytics_id',
  'google_analytics_enabled',
  'facebook_pixel_id',
  'facebook_pixel_enabled',
  'google_tag_manager_id',
  'google_tag_manager_enabled',
  'tiktok_pixel_id',
  'tiktok_pixel_enabled',
  'custom_tracking_scripts',
  'custom_scripts_enabled',
  'default_currency',
  'commerce_type',
  'metadata',
  'is_active',
]);

const UNSUPPORTED_STORE_FIELDS: string[] = ['seo_score', 'theme_color'];

type AnyObject = Record<string, unknown>;

/**
 * Nettoie un payload d'update/insert pour la table `stores`.
 */
export function sanitizeStorePayload<T extends AnyObject>(payload: T): T {
  const cleaned: AnyObject = {};

  Object.entries(payload as AnyObject).forEach(([key, value]) => {
    if (value === undefined) return;
    if (UNSUPPORTED_STORE_FIELDS.includes(key)) return;
    if (!STORE_WRITABLE_COLUMNS.has(key)) return;
    cleaned[key] = value;
  });

  return cleaned as T;
}
