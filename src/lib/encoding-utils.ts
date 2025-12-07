/**
 * Utilitaires pour l'encodage et le décodage
 * Fournit des fonctions réutilisables pour encoder/décoder des données
 */

/**
 * Encode une chaîne en Base64
 */
export function encodeBase64(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(str);
  }
  // Fallback pour Node.js
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  throw new Error('Base64 encoding not supported in this environment');
}

/**
 * Décode une chaîne Base64
 */
export function decodeBase64(base64: string): string {
  if (typeof atob === 'function') {
    return atob(base64);
  }
  // Fallback pour Node.js
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  throw new Error('Base64 decoding not supported in this environment');
}

/**
 * Encode une chaîne en URL (encodeURIComponent)
 */
export function encodeURI(str: string): string {
  return encodeURIComponent(str);
}

/**
 * Décode une chaîne URL (decodeURIComponent)
 */
export function decodeURI(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/**
 * Encode un objet en query string
 */
export function encodeQueryString(params: Record<string, any>): string {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(String(value));
      pairs.push(`${encodedKey}=${encodedValue}`);
    }
  }
  return pairs.join('&');
}

/**
 * Décode une query string en objet
 */
export function decodeQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  }

  return params;
}

/**
 * Encode une chaîne en HTML entities
 */
export function encodeHTMLEntities(str: string): string {
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => entityMap[char] || char);
}

/**
 * Décode les HTML entities
 */
export function decodeHTMLEntities(str: string): string {
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  }

  // Fallback pour Node.js
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
  };

  return str.replace(/&[#\w]+;/g, (entity) => {
    return entityMap[entity] || entity;
  });
}

/**
 * Encode une chaîne en hexadécimal
 */
export function encodeHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Décode une chaîne hexadécimale
 */
export function decodeHex(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substr(i, 2), 16);
    str += String.fromCharCode(charCode);
  }
  return str;
}

/**
 * Encode un objet en JSON puis Base64
 */
export function encodeJSONBase64<T>(obj: T): string {
  const json = JSON.stringify(obj);
  return encodeBase64(json);
}

/**
 * Décode depuis Base64 puis JSON
 */
export function decodeJSONBase64<T>(base64: string): T {
  const json = decodeBase64(base64);
  return JSON.parse(json) as T;
}

/**
 * Hash une chaîne avec SHA-256 (async)
 */
export async function hashSHA256(str: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('SHA-256 hashing not supported in this environment');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash une chaîne avec SHA-256 (sync - simple hash)
 */
export function hashSHA256Simple(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Génère un hash simple d'un objet
 */
export function hashObject(obj: any): string {
  const json = JSON.stringify(obj);
  return hashSHA256Simple(json);
}

/**
 * Encode une chaîne avec ROT13
 */
export function encodeROT13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (char) => {
    const charCode = char.charCodeAt(0);
    const base = charCode >= 97 ? 97 : 65; // lowercase or uppercase
    return String.fromCharCode(((charCode - base + 13) % 26) + base);
  });
}

/**
 * Décode une chaîne ROT13 (même fonction que encode)
 */
export function decodeROT13(str: string): string {
  return encodeROT13(str); // ROT13 est symétrique
}

/**
 * Obfusque une chaîne (simple)
 */
export function obfuscate(str: string): string {
  return encodeBase64(str).split('').reverse().join('');
}

/**
 * Désobfusque une chaîne
 */
export function deobfuscate(obfuscated: string): string {
  return decodeBase64(obfuscated.split('').reverse().join(''));
}

/**
 * Vérifie si une chaîne est encodée en Base64
 */
export function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * Vérifie si une chaîne est encodée en hexadécimal
 */
export function isHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str);
}

