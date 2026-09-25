export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const getStoreDomain = (): string => {
  // Détermine le domaine racine utilisé pour les boutiques.
  // Priorité :
  // 1. Variable d'environnement explicite (recommandée en production)
  // 2. Domaine actuel (hostname) comme fallback
  const meta = import.meta as unknown as {
    env?: {
      VITE_PUBLIC_STORE_DOMAIN?: string;
      VITE_APP_DOMAIN?: string;
      VITE_SITE_URL?: string;
    };
  };

  const envDomain =
    meta.env?.VITE_PUBLIC_STORE_DOMAIN || meta.env?.VITE_APP_DOMAIN || meta.env?.VITE_SITE_URL;

  if (envDomain && typeof envDomain === 'string') {
    // Normaliser : retirer le protocole et les éventuels slashs de fin
    return envDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }

  // Fallback : on utilise le hostname courant (dev ou prod)
  const hostname = window.location.hostname;
  return hostname;
};

/**
 * Génère l'URL complète d'une boutique
 *
 * IMPORTANT: Utilise myemarzona.shop pour les boutiques des utilisateurs
 * Le domaine emarzona.com est réservé à la plateforme principale
 *
 * @param slug - Le slug de la boutique
 * @param subdomain - Le sous-domaine de la boutique (généré automatiquement)
 * @param customDomain - Domaine personnalisé optionnel
 */
export const generateStoreUrl = (
  slug: string,
  subdomain?: string | null,
  customDomain?: string
): string => {
  // Si un domaine personnalisé est configuré, l'utiliser
  if (customDomain) {
    const protocol = 'https';
    const normalizedDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `${protocol}://${normalizedDomain}`;
  }

  // Sinon, utiliser myemarzona.shop (domaine dédié aux boutiques)
  const protocol = 'https'; // Toujours HTTPS en production
  const storeSubdomain = subdomain || slug; // Utiliser subdomain si disponible, sinon slug
  return `${protocol}://${storeSubdomain}.myemarzona.shop`;
};

/**
 * Génère l'URL complète d'un produit dans une boutique
 *
 * @param storeSlug - Le slug de la boutique
 * @param storeSubdomain - Le sous-domaine de la boutique (généré automatiquement)
 * @param productSlug - Le slug du produit
 * @param customDomain - Domaine personnalisé optionnel
 */
export const generateProductUrl = (
  storeSlug: string,
  productSlug: string,
  storeSubdomain?: string | null,
  customDomain?: string
): string => {
  // Si un domaine personnalisé est configuré, l'utiliser
  if (customDomain) {
    const protocol = 'https';
    const normalizedDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `${protocol}://${normalizedDomain}/products/${productSlug}`;
  }

  // Sinon, utiliser myemarzona.shop
  const protocol = 'https';
  const subdomain = storeSubdomain || storeSlug;
  return `${protocol}://${subdomain}.myemarzona.shop/products/${productSlug}`;
};

export type StorefrontItemRef = {
  id: string;
  slug?: string | null;
  product_type?: string | null;
};

/** Origine plateforme pour les verticales sans route boutique (ex. cours LMS). */
export const PLATFORM_WWW_ORIGIN = 'https://www.emarzona.com';

/**
 * Chemin relatif sur le host boutique (*.myemarzona.shop), par verticale.
 * Aligné sur `storeSubdomainRoutes` : /products, /service, /artist.
 * Course → null (LMS uniquement sur www).
 */
export function buildStorefrontItemPath(product: StorefrontItemRef): string | null {
  const type = product.product_type;
  if (type === 'course') {
    return null;
  }
  if (type === 'service') {
    const segment = product.slug?.trim() || product.id;
    return `/service/${segment}`;
  }
  if (type === 'artist') {
    return `/artist/${product.id}`;
  }
  const segment = product.slug?.trim() || product.id;
  return `/products/${segment}`;
}

/**
 * URL absolue d'un item sur la boutique vendeur (*.myemarzona.shop ou domaine custom).
 * Les cours (LMS) pointent vers www.emarzona.com/courses/:slug — pas de route cours sur le sous-domaine.
 */
export function generateStorefrontItemUrl(
  storeSlug: string,
  product: StorefrontItemRef,
  storeSubdomain?: string | null,
  customDomain?: string
): string {
  if (product.product_type === 'course') {
    const slug = product.slug?.trim();
    if (slug) return `${PLATFORM_WWW_ORIGIN}/courses/${slug}`;
    return `${PLATFORM_WWW_ORIGIN}/courses/${product.id}`;
  }

  const base = generateStoreUrl(storeSlug, storeSubdomain, customDomain);
  const path = buildStorefrontItemPath(product);
  return `${base}${path ?? `/products/${product.slug?.trim() || product.id}`}`;
}

/**
 * Génère l'URL premium de paiement d'un produit.
 * Exemple: `https://digitallog.myemarzona.shop/pay/mon-produit`
 */
export const generatePaymentUrl = (
  storeSlug: string,
  productSlug: string,
  storeSubdomain?: string | null,
  customDomain?: string
): string => {
  if (customDomain) {
    const protocol = 'https';
    const normalizedDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `${protocol}://${normalizedDomain}/pay/${productSlug}`;
  }

  const protocol = 'https';
  const subdomain = storeSubdomain || storeSlug;
  return `${protocol}://${subdomain}.myemarzona.shop/pay/${productSlug}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (_err2) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};
