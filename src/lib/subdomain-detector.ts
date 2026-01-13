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
}

/**
 * Domaines de base configurés
 */
const BASE_DOMAINS = [
  'myemarzona.shop',
  'emarzona.com',
  'api.emarzona.com',
  'localhost', // Pour le développement local
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
    // Server-side rendering
    return {
      subdomain: null,
      baseDomain: '',
      fullHost: '',
      isSubdomain: false,
    };
  }

  const hostname = window.location.hostname.toLowerCase();
  const fullHost = window.location.host;

  // Chercher le domaine de base correspondant
  for (const baseDomain of BASE_DOMAINS) {
    if (hostname === baseDomain) {
      // Pas de sous-domaine
      return {
        subdomain: null,
        baseDomain,
        fullHost,
        isSubdomain: false,
      };
    }

    if (hostname.endsWith(`.${baseDomain}`)) {
      // Extraire le sous-domaine
      let subdomain = hostname.replace(`.${baseDomain}`, '');

      // Si c'est "www", essayer d'extraire le vrai sous-domaine
      if (subdomain.startsWith('www.')) {
        subdomain = subdomain.replace('www.', '');
      }

      return {
        subdomain: subdomain || null,
        baseDomain,
        fullHost,
        isSubdomain: true,
      };
    }
  }

  // Pour le développement local (localhost:8080, 127.0.0.1:8080, etc.)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    // Essayer d'extraire depuis l'URL complète ou les paramètres
    const urlParams = new URLSearchParams(window.location.search);
    const subdomainParam = urlParams.get('subdomain');

    if (subdomainParam) {
      return {
        subdomain: subdomainParam.toLowerCase(),
        baseDomain: 'localhost',
        fullHost,
        isSubdomain: true,
      };
    }

    return {
      subdomain: null,
      baseDomain: 'localhost',
      fullHost,
      isSubdomain: false,
    };
  }

  // Si aucun domaine de base ne correspond, essayer d'extraire quand même
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const potentialSubdomain = parts[0];
    return {
      subdomain: potentialSubdomain,
      baseDomain: parts.slice(1).join('.'),
      fullHost,
      isSubdomain: true,
    };
  }

  return {
    subdomain: null,
    baseDomain: hostname,
    fullHost,
    isSubdomain: false,
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
