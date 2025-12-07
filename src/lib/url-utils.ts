/**
 * Utilitaires pour la manipulation d'URL
 * Fournit des fonctions réutilisables pour construire, parser et manipuler les URLs
 */

export interface URLParts {
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}

/**
 * Construit une URL à partir de ses parties
 */
export function buildUrl(parts: URLParts): string {
  const protocol = parts.protocol || window.location.protocol;
  const hostname = parts.hostname || window.location.hostname;
  const port = parts.port ? `:${parts.port}` : '';
  const pathname = parts.pathname || '';
  const search = parts.search || '';
  const hash = parts.hash || '';

  return `${protocol}//${hostname}${port}${pathname}${search}${hash}`;
}

/**
 * Parse une URL et retourne ses parties
 */
export function parseUrl(url: string): URLParts | null {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
    };
  } catch {
    return null;
  }
}

/**
 * Ajoute des paramètres de requête à une URL
 */
export function addQueryParams(url: string, params: Record<string, string | number | boolean | null | undefined>): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlObj.searchParams.set(key, String(value));
      }
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Supprime des paramètres de requête d'une URL
 */
export function removeQueryParams(url: string, keys: string[]): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    keys.forEach((key) => {
      urlObj.searchParams.delete(key);
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Obtient un paramètre de requête depuis une URL
 */
export function getQueryParam(url: string, key: string): string | null {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.searchParams.get(key);
  } catch {
    return null;
  }
}

/**
 * Obtient tous les paramètres de requête depuis une URL
 */
export function getAllQueryParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url, window.location.origin);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  } catch {
    return {};
  }
}

/**
 * Remplace tous les paramètres de requête d'une URL
 */
export function setQueryParams(url: string, params: Record<string, string | number | boolean | null | undefined>): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Supprimer tous les paramètres existants
    urlObj.search = '';
    
    // Ajouter les nouveaux paramètres
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlObj.searchParams.set(key, String(value));
      }
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Construit une URL relative à partir d'un chemin
 */
export function buildRelativeUrl(path: string, params?: Record<string, string | number | boolean | null | undefined>): string {
  const url = path.startsWith('/') ? path : `/${path}`;
  
  if (params) {
    return addQueryParams(url, params);
  }
  
  return url;
}

/**
 * Construit une URL absolue à partir d'un chemin
 */
export function buildAbsoluteUrl(path: string, params?: Record<string, string | number | boolean | null | undefined>): string {
  const origin = window.location.origin;
  const url = path.startsWith('/') ? `${origin}${path}` : `${origin}/${path}`;
  
  if (params) {
    return addQueryParams(url, params);
  }
  
  return url;
}

/**
 * Vérifie si une URL est absolue
 */
export function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie si une URL est relative
 */
export function isRelativeUrl(url: string): boolean {
  return !isAbsoluteUrl(url);
}

/**
 * Normalise une URL (supprime les doubles slashes, etc.)
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.toString();
  } catch {
    // Pour les URLs relatives, normaliser manuellement
    return url.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }
}

/**
 * Combine un chemin de base avec un chemin relatif
 */
export function combinePaths(base: string, path: string): string {
  const baseNormalized = base.replace(/\/$/, '');
  const pathNormalized = path.replace(/^\//, '');
  return `${baseNormalized}/${pathNormalized}`;
}

/**
 * Extrait le domaine d'une URL
 */
export function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Extrait le chemin d'une URL
 */
export function getPathname(url: string): string | null {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname;
  } catch {
    return null;
  }
}

/**
 * Vérifie si deux URLs pointent vers le même domaine
 */
export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = getDomain(url1);
  const domain2 = getDomain(url2);
  return domain1 !== null && domain2 !== null && domain1 === domain2;
}

/**
 * Crée une URL de redirection sécurisée (vérifie le domaine)
 */
export function createSafeRedirectUrl(url: string, allowedDomains?: string[]): string | null {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Si des domaines autorisés sont spécifiés, vérifier
    if (allowedDomains && allowedDomains.length > 0) {
      const domain = urlObj.hostname;
      const isAllowed = allowedDomains.some((allowed) => {
        if (allowed.startsWith('.')) {
          // Domaine avec wildcard (ex: .example.com)
          return domain.endsWith(allowed) || domain === allowed.slice(1);
        }
        return domain === allowed;
      });
      
      if (!isAllowed) {
        return null;
      }
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

