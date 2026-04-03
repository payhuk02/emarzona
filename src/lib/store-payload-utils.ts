import type { Store as FrontendStore } from '@/hooks/useStores';

/**
 * Champs qui ne doivent PAS être envoyés à la table `stores`
 * car ils n'existent pas dans le schéma Supabase actuel.
 */
const UNSUPPORTED_STORE_FIELDS: string[] = [
  // Champs Open Graph détaillés (pas de colonnes og_title / og_description dans stores)
  'og_title',
  'og_description',
  // Score SEO calculé côté serveur
  'seo_score',
  // Couleur de thème legacy (pas de colonne theme_color utilisée directement)
  'theme_color',
];

type AnyObject = Record<string, unknown>;

/**
 * Nettoie un payload d'update/insert pour la table `stores` en
 * supprimant les colonnes qui ne sont pas présentes dans le schéma.
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

    if (UNSUPPORTED_STORE_FIELDS.includes(key)) {
      return;
    }

    cleaned[key] = value;
  });

  return cleaned as T;
}
