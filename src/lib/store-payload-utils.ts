/**
 * Champs autorisés en écriture sur public.stores (aligné migrations déployées).
 * Les colonnes apparence sont sur store_appearance (Sprint 3).
 */
const STORE_WRITABLE_COLUMNS = new Set([
  'name',
  'slug',
  'description',
  'about',
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
  'meta_title',
  'meta_description',
  'meta_keywords',
  'og_title',
  'og_description',
  'og_image',
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
 * Note: `user_id` est volontairement exclu — le réinjecter explicitement à la création.
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
