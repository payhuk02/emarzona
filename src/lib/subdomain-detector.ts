/**
 * Détecteur de sous-domaine pour le système multi-tenant
 *
 * Utilisé côté client pour détecter le sous-domaine depuis lequel
 * l'application est accédée et charger la boutique correspondante
 *
 * Date: 1 Février 2025
 */

import { RESERVED_STORE_SLUGS, isReservedStoreSlug } from '@/lib/store/reserved-store-slugs';

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
 * Sous-domaines réservés qui ne doivent pas être utilisés comme boutiques.
 * Source de vérité partagée : `reserved-store-slugs.ts` (+ SQL `is_slug_reserved`).
 */
export const RESERVED_SUBDOMAINS = [...RESERVED_STORE_SLUGS];

/**
 * Domaines de base configurés
 *
 * IMPORTANT: Séparation des domaines
 * - emarzona.com : Plateforme principale (dashboard, marketplace, etc.)
 * - myemarzona.shop : Boutiques des utilisateurs uniquement (*.myemarzona.shop)
 */
const PLATFORM_DOMAINS = [
  'emarzona.com',
  'www.emarzona.com',
  'api.emarzona.com',
  'vercel.app', // Déploiements Vercel / preview
  'localhost', // Pour le développement local
];

const STORE_DOMAINS = [
  'myemarzona.shop', // Domaine dédié aux boutiques des utilisateurs
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
      const isKnownStoreDomain = STORE_DOMAINS.some(d =>
        potentialBaseDomain.includes(d.split('.')[0])
      );
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
  return isReservedStoreSlug(subdomain);
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
