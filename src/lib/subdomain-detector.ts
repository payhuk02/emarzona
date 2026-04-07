/**
 * Détecteur de sous-domaine pour le système multi-tenant
 *
 * Utilisé côté client pour détecter le sous-domaine depuis lequel
 * l'application est accédée et charger la boutique correspondante
 *
 * Date: 1 Février 2025
 */

export interface SubdomainInfo {
  subdomain: string | null;
  baseDomain: string;
  fullHost: string;
  isSubdomain: boolean;
  isStoreDomain: boolean; // true si on est sur myemarzona.shop
  isPlatformDomain: boolean; // true si on est sur emarzona.com
  isCustomDomain: boolean; // true si on est sur un domaine personnalisé
  customDomain: string | null; // le domaine personnalisé complet
}

/**
 * Domaines de base configurés
 *
 * IMPORTANT: Séparation des domaines
 * - emarzona.com : Plateforme principale (dashboard, marketplace, etc.)
 * - myemarzona.shop : Boutiques des utilisateurs uniquement (*.myemarzona.shop)
 */
const PLATFORM_DOMAINS = [
  'emarzona.com',
  'api.emarzona.com',
  'lovable.app', // Preview Lovable
  'lovable.dev', // Lovable dev
  'lovableproject.com', // Lovable project preview
  'vercel.app', // Déploiements Vercel
  'localhost', // Pour le développement local
];

const STORE_DOMAINS = [
  'myemarzona.shop', // Domaine dédié aux boutiques des utilisateurs
];

/**
 * Sous-domaines réservés qui ne doivent pas être utilisés comme boutiques
 */
export const RESERVED_SUBDOMAINS = [
  'www',
  'admin',
  'api',
  'app',
  'support',
  'help',
  'my',
  'mail',
  'ftp',
  'smtp',
  'pop',
  'imap',
  'blog',
  'shop',
  'store',
  'marketplace',
  'dashboard',
  'account',
  'accounts',
  'auth',
  'login',
  'signup',
  'register',
  'password',
  'reset',
  'verify',
  'confirm',
  'settings',
  'profile',
  'billing',
  'payment',
  'checkout',
  'cart',
  'order',
  'orders',
  'product',
  'products',
  'category',
  'categories',
  'search',
  'filter',
  'filters',
  'about',
  'contact',
  'terms',
  'privacy',
  'legal',
  'faq',
  'docs',
  'documentation',
  'status',
  'health',
  'ping',
  'test',
  'staging',
  'dev',
  'cdn',
  'assets',
  'static',
  'media',
  'images',
  'files',
  'api-docs',
  'swagger',
  'graphql',
  'webhook',
  'webhooks',
  'admin-panel',
  'cpanel',
  'phpmyadmin',
  'wp-admin',
  'email',
  'mx',
  'ns1',
  'ns2',
  'dns',
  'domain',
  'subdomain',
  'wildcard',
  'catch-all',
  'default',
  'fallback',
];

/**
 * Détecte le sous-domaine depuis le hostname actuel
 *
 * @returns Informations sur le sous-domaine détecté
 */
export function detectSubdomain(): SubdomainInfo {
  if (typeof window === 'undefined') {
    return {
      subdomain: null,
      baseDomain: '',
      fullHost: '',
      isSubdomain: false,
      isStoreDomain: false,
      isPlatformDomain: false,
      isCustomDomain: false,
      customDomain: null,
    };
  }

  const hostname = window.location.hostname.toLowerCase();
  const fullHost = window.location.host;

  // 1. Vérifier si on est sur un domaine de boutique (myemarzona.shop)
  for (const storeDomain of STORE_DOMAINS) {
    if (hostname === storeDomain) {
      return {
        subdomain: null,
        baseDomain: storeDomain,
        fullHost,
        isSubdomain: false,
        isStoreDomain: true,
        isPlatformDomain: false,
        isCustomDomain: false,
        customDomain: null,
      };
    }

    if (hostname.endsWith(`.${storeDomain}`)) {
      let subdomain = hostname.replace(`.${storeDomain}`, '');
      if (subdomain.startsWith('www.')) {
        subdomain = subdomain.replace('www.', '');
      }

      return {
        subdomain: subdomain || null,
        baseDomain: storeDomain,
        fullHost,
        isSubdomain: !!subdomain,
        isStoreDomain: true,
        isPlatformDomain: false,
        isCustomDomain: false,
        customDomain: null,
      };
    }
  }

  // 2. Vérifier si on est sur un domaine de plateforme (emarzona.com)
  for (const platformDomain of PLATFORM_DOMAINS) {
    if (hostname === platformDomain || hostname.endsWith(`.${platformDomain}`)) {
      return {
        subdomain: null,
        baseDomain: platformDomain,
        fullHost,
        isSubdomain: false,
        isStoreDomain: false,
        isPlatformDomain: true,
        isCustomDomain: false,
        customDomain: null,
      };
    }
  }

  // 3. Pour le développement local
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    const urlParams = new URLSearchParams(window.location.search);
    const subdomainParam = urlParams.get('subdomain');

    if (subdomainParam) {
      return {
        subdomain: subdomainParam.toLowerCase(),
        baseDomain: 'localhost',
        fullHost,
        isSubdomain: true,
        isStoreDomain: true,
        isPlatformDomain: false,
        isCustomDomain: false,
        customDomain: null,
      };
    }

    return {
      subdomain: null,
      baseDomain: 'localhost',
      fullHost,
      isSubdomain: false,
      isStoreDomain: false,
      isPlatformDomain: true,
      isCustomDomain: false,
      customDomain: null,
    };
  }

  // 4. Si aucun domaine connu ne correspond, c'est potentiellement un domaine personnalisé
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    // Vérifier si c'est un sous-domaine d'un domaine de boutique connu
    if (parts.length >= 3) {
      const potentialBaseDomain = parts.slice(1).join('.');
      const isKnownStoreDomain = STORE_DOMAINS.some(d => potentialBaseDomain.includes(d.split('.')[0]));
      if (isKnownStoreDomain) {
        return {
          subdomain: parts[0],
          baseDomain: potentialBaseDomain,
          fullHost,
          isSubdomain: true,
          isStoreDomain: true,
          isPlatformDomain: false,
          isCustomDomain: false,
          customDomain: null,
        };
      }
    }

    // C'est un domaine personnalisé (ex: maboutique.com)
    return {
      subdomain: null,
      baseDomain: hostname,
      fullHost,
      isSubdomain: false,
      isStoreDomain: false,
      isPlatformDomain: false,
      isCustomDomain: true,
      customDomain: hostname,
    };
  }

  // 5. Par défaut, considérer comme plateforme
  return {
    subdomain: null,
    baseDomain: hostname,
    fullHost,
    isSubdomain: false,
    isStoreDomain: false,
    isPlatformDomain: true,
    isCustomDomain: false,
    customDomain: null,
  };
}

/**
 * Vérifie si un sous-domaine est réservé
 */
export function isSubdomainReserved(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase().trim());
}

/**
 * Valide le format d'un sous-domaine
 *
 * @param subdomain - Le sous-domaine à valider
 * @returns true si le format est valide
 */
export function isValidSubdomainFormat(subdomain: string): boolean {
  if (!subdomain || subdomain.trim() === '') {
    return false;
  }

  const trimmed = subdomain.trim().toLowerCase();

  // Longueur maximale (RFC 1035)
  if (trimmed.length > 63) {
    return false;
  }

  // Format: lettres minuscules, chiffres, tirets uniquement
  // Ne peut pas commencer ou finir par un tiret
  const pattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  return pattern.test(trimmed);
}

/**
 * Valide un sous-domaine (format + réservé)
 */
export function validateSubdomain(subdomain: string): {
  valid: boolean;
  error?: string;
} {
  if (!subdomain || subdomain.trim() === '') {
    return {
      valid: false,
      error: 'Le sous-domaine ne peut pas être vide',
    };
  }

  if (!isValidSubdomainFormat(subdomain)) {
    return {
      valid: false,
      error:
        'Format invalide. Utilisez uniquement des lettres minuscules, chiffres et tirets (max 63 caractères)',
    };
  }

  if (isSubdomainReserved(subdomain)) {
    return {
      valid: false,
      error: `Le sous-domaine "${subdomain}" est réservé et ne peut pas être utilisé`,
    };
  }

  return { valid: true };
}
