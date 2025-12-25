/**
 * Utilitaires pour la manipulation des query strings
 * Fournit des fonctions réutilisables pour gérer les paramètres d'URL
 */

export interface QueryParams {
  [key: string]: string | string[] | number | boolean | null | undefined;
}

/**
 * Parse une query string en objet
 */
export function parseQueryString(queryString: string): QueryParams {
  const params: QueryParams = {};

  if (!queryString || queryString.length === 0) {
    return params;
  }

  // Supprimer le '?' au début si présent
  const cleanQuery = queryString.startsWith('?') ? queryString.slice(1) : queryString;

  const pairs = cleanQuery.split('&');

  for (const pair of pairs) {
    if (!pair) continue;

    const [key, value] = pair.split('=');
    if (!key) continue;

    const decodedKey = decodeURIComponent(key);
    const decodedValue = value ? decodeURIComponent(value) : '';

    // Si la clé existe déjà, convertir en tableau
    if (params[decodedKey] !== undefined) {
      const existing = params[decodedKey];
      if (Array.isArray(existing)) {
        existing.push(decodedValue);
      } else {
        params[decodedKey] = [String(existing), decodedValue];
      }
    } else {
      params[decodedKey] = decodedValue;
    }
  }

  return params;
}

/**
 * Construit une query string depuis un objet
 */
export function buildQueryString(params: QueryParams): string {
  const pairs: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }

    const encodedKey = encodeURIComponent(key);

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          pairs.push(`${encodedKey}=${encodeURIComponent(String(item))}`);
        }
      }
    } else {
      pairs.push(`${encodedKey}=${encodeURIComponent(String(value))}`);
    }
  }

  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

/**
 * Obtient les paramètres de l'URL actuelle
 */
export function getCurrentQueryParams(): QueryParams {
  if (typeof window === 'undefined') {
    return {};
  }

  return parseQueryString(window.location.search);
}

/**
 * Obtient un paramètre spécifique de l'URL actuelle
 */
export function getQueryParam(name: string): string | string[] | null {
  const params = getCurrentQueryParams();
  return params[name] ?? null;
}

/**
 * Définit un paramètre dans l'URL actuelle
 */
export function setQueryParam(
  name: string,
  value: string | string[] | number | boolean | null | undefined,
  options: { replace?: boolean } = {}
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = getCurrentQueryParams();
  
  if (value === null || value === undefined) {
    delete params[name];
  } else {
    params[name] = value;
  }

  const newQueryString = buildQueryString(params);
  const newUrl = `${window.location.pathname}${newQueryString}${window.location.hash}`;

  if (options.replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
}

/**
 * Supprime un paramètre de l'URL actuelle
 */
export function removeQueryParam(name: string, options: { replace?: boolean } = {}): void {
  setQueryParam(name, null, options);
}

/**
 * Supprime plusieurs paramètres de l'URL actuelle
 */
export function removeQueryParams(names: string[], options: { replace?: boolean } = {}): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = getCurrentQueryParams();
  for (const name of names) {
    delete params[name];
  }

  const newQueryString = buildQueryString(params);
  const newUrl = `${window.location.pathname}${newQueryString}${window.location.hash}`;

  if (options.replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
}

/**
 * Remplace tous les paramètres de l'URL actuelle
 */
export function replaceQueryParams(
  newParams: QueryParams,
  options: { replace?: boolean } = {}
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const newQueryString = buildQueryString(newParams);
  const newUrl = `${window.location.pathname}${newQueryString}${window.location.hash}`;

  if (options.replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
}

/**
 * Fusionne les paramètres existants avec de nouveaux
 */
export function mergeQueryParams(
  newParams: QueryParams,
  options: { replace?: boolean } = {}
): void {
  const currentParams = getCurrentQueryParams();
  const merged = { ...currentParams, ...newParams };
  replaceQueryParams(merged, options);
}

/**
 * Obtient un paramètre comme string
 */
export function getQueryParamString(name: string, defaultValue: string = ''): string {
  const value = getQueryParam(name);
  if (Array.isArray(value)) {
    return value[0] || defaultValue;
  }
  return value ? String(value) : defaultValue;
}

/**
 * Obtient un paramètre comme number
 */
export function getQueryParamNumber(name: string, defaultValue: number = 0): number {
  const value = getQueryParamString(name);
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Obtient un paramètre comme boolean
 */
export function getQueryParamBoolean(name: string, defaultValue: boolean = false): boolean {
  const value = getQueryParamString(name);
  if (value === '') {
    return defaultValue;
  }
  return value === 'true' || value === '1';
}

/**
 * Obtient un paramètre comme array
 */
export function getQueryParamArray(name: string): string[] {
  const value = getQueryParam(name);
  if (Array.isArray(value)) {
    return value;
  }
  if (value) {
    return [String(value)];
  }
  return [];
}

/**
 * Vérifie si un paramètre existe
 */
export function hasQueryParam(name: string): boolean {
  return getQueryParam(name) !== null;
}

/**
 * Construit une URL avec des paramètres
 */
export function buildUrl(
  baseUrl: string,
  params?: QueryParams,
  hash?: string
): string {
  const url = new URL(baseUrl, window.location.origin);
  
  if (params) {
    const queryString = buildQueryString(params);
    url.search = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  }

  if (hash) {
    url.hash = hash.startsWith('#') ? hash.slice(1) : hash;
  }

  return url.toString();
}

/**
 * Parse une URL complète et retourne les paramètres
 */
export function parseUrl(url: string): {
  protocol: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
  params: QueryParams;
} {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      host: urlObj.host,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      params: parseQueryString(urlObj.search),
    };
  } catch {
    // Fallback pour les URLs relatives
    const match = url.match(/^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/);
    if (match) {
      return {
        protocol: match[1] || '',
        host: match[2] || '',
        pathname: match[3] || '',
        search: match[4] || '',
        hash: match[5] || '',
        params: parseQueryString(match[4] || ''),
      };
    }
    return {
      protocol: '',
      host: '',
      pathname: url,
      search: '',
      hash: '',
      params: {},
    };
  }
}

