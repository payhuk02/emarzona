/**
 * Utilitaires pour la manipulation de chaînes de caractères
 * Fournit des fonctions réutilisables pour traiter les chaînes
 */

/**
 * Tronque une chaîne à une longueur maximale
 */
export function truncate(str: string | null | undefined, maxLength: number, suffix: string = '...'): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalise la première lettre
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalise chaque mot
 */
export function capitalizeWords(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Convertit en slug URL-friendly
 */
export function slugify(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Supprime les accents
 */
export function removeAccents(str: string | null | undefined): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Vérifie si une chaîne est vide ou ne contient que des espaces
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Vérifie si une chaîne n'est pas vide
 */
export function isNotEmpty(str: string | null | undefined): boolean {
  return !isEmpty(str);
}

/**
 * Supprime les espaces en début et fin
 */
export function trim(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim();
}

/**
 * Supprime tous les espaces
 */
export function removeSpaces(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/\s+/g, '');
}

/**
 * Remplace plusieurs espaces par un seul
 */
export function normalizeSpaces(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Extrait les mots-clés d'une chaîne
 */
export function extractKeywords(str: string | null | undefined, minLength: number = 3): string[] {
  if (!str) return [];
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= minLength)
    .filter((word, index, arr) => arr.indexOf(word) === index); // Unique
}

/**
 * Masque une partie d'une chaîne (ex: email, téléphone)
 */
export function mask(str: string | null | undefined, start: number = 0, end: number = 0, maskChar: string = '*'): string {
  if (!str) return '';
  if (str.length <= start + end) return maskChar.repeat(str.length);
  const visibleStart = str.substring(0, start);
  const visibleEnd = str.substring(str.length - end);
  const masked = maskChar.repeat(str.length - start - end);
  return visibleStart + masked + visibleEnd;
}

/**
 * Masque un email
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return mask(email, 2, 0);
  const maskedLocal = mask(local, 2, 0);
  return `${maskedLocal}@${domain}`;
}

/**
 * Masque un numéro de téléphone
 */
export function maskPhone(phone: string | null | undefined, countryCode: string = ''): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 4) return mask(phone, 0, 0);
  return `${countryCode}${mask(cleaned, cleaned.length - 4, 0)}`;
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhone(phone: string | null | undefined, format: string = 'XX XX XX XX XX'): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  let  formatted= format;
  let  digitIndex= 0;

  for (let  i= 0; i < formatted.length && digitIndex < digits.length; i++) {
    if (formatted[i] === 'X') {
      formatted = formatted.substring(0, i) + digits[digitIndex] + formatted.substring(i + 1);
      digitIndex++;
    }
  }

  return formatted;
}

/**
 * Extrait les URLs d'une chaîne
 */
export function extractUrls(str: string | null | undefined): string[] {
  if (!str) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return str.match(urlRegex) || [];
}

/**
 * Convertit les URLs en liens HTML
 */
export function linkify(str: string | null | undefined): string {
  if (!str) return '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return str.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

/**
 * Compte les mots
 */
export function wordCount(str: string | null | undefined): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Compte les caractères
 */
export function charCount(str: string | null | undefined, includeSpaces: boolean = true): number {
  if (!str) return 0;
  return includeSpaces ? str.length : str.replace(/\s/g, '').length;
}

/**
 * Génère un hash simple d'une chaîne
 */
export function simpleHash(str: string | null | undefined): string {
  if (!str) return '';
  let  hash= 0;
  for (let  i= 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Vérifie si une chaîne contient un mot
 */
export function containsWord(str: string | null | undefined, word: string, caseSensitive: boolean = false): boolean {
  if (!str) return false;
  const searchStr = caseSensitive ? str : str.toLowerCase();
  const searchWord = caseSensitive ? word : word.toLowerCase();
  return searchStr.split(/\s+/).includes(searchWord);
}

/**
 * Remplace la première occurrence
 */
export function replaceFirst(str: string | null | undefined, search: string, replace: string): string {
  if (!str) return '';
  return str.replace(search, replace);
}

/**
 * Remplace toutes les occurrences
 */
export function replaceAll(str: string | null | undefined, search: string, replace: string): string {
  if (!str) return '';
  return str.split(search).join(replace);
}

/**
 * Supprime les balises HTML
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.textContent = html;
    return tmp.textContent || '';
  }
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Échappe les caractères HTML
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  const  map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Déséchappe les caractères HTML
 */
export function unescapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  const  map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  };
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (m) => map[m]);
}







