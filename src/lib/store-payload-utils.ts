import type { Store as FrontendStore } from '@/hooks/useStores';

/**
 * Champs qui ne doivent PAS être envoyés à la table `stores`
 * car ils appartiennent à d'autres tables (SEO, tracking) ou ne sont
 * pas encore présents dans le schéma Supabase actuel.
 *
 * Envoyer ces colonnes provoque des erreurs du type :
 * `column "meta_title" of relation "stores" does not exist`
 */
const UNSUPPORTED_STORE_FIELDS: (keyof FrontendStore | string)[] = [
  // SEO avancé – stocké dans d'autres tables (ex: store_seo_settings)
  'meta_title',
  'meta_description',
  'meta_keywords',
  'og_image',
  // Champs Open Graph détaillés (gérés ailleurs)
  'og_title',
  'og_description',
  // Score / couleur de thème legacy
  'seo_score',
  'theme_color',
  // Phase 2 – tracking / analytics (table dédiée dans Supabase)
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
];

type AnyObject = Record<string, unknown>;

/**
 * Nettoie un payload d'update/insert pour la table `stores` en
 * supprimant les colonnes qui ne sont pas (ou plus) présentes dans le schéma.
 *
 * - Ne modifie pas l'objet d'origine (copie défensive).
 * - Ignore aussi les valeurs `undefined` qui ne doivent pas être envoyées.
 */
export function sanitizeStorePayload<T extends AnyObject>(payload: T): T {
  const cleaned: AnyObject = {};

  Object.entries(payload as AnyObject).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (UNSUPPORTED_STORE_FIELDS.includes(key as keyof FrontendStore)) {
      return;
    }

    cleaned[key] = value;
  });

  return cleaned as T;
}
