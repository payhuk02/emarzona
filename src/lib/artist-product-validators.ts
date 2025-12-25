/**
 * 🔍 ARTIST PRODUCT VALIDATORS - Phase 2 Validation
 * Date: 31 Janvier 2025
 *
 * Validations de format spécifiques pour les champs du formulaire "Oeuvre d'artiste"
 */

import { validateURL, validateSocialURLs } from './validation-utils';

// ============================================================================
// VALIDATION ISBN
// ============================================================================

/**
 * Valide un ISBN (ISBN-10 ou ISBN-13)
 *
 * @param isbn - ISBN à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateISBN(isbn: string): string | null {
  if (!isbn || !isbn.trim()) return null; // Optionnel

  // Nettoyer l'ISBN (enlever tirets et espaces)
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  // ISBN-10: 10 chiffres (le dernier peut être X)
  const isbn10Regex = /^[0-9]{9}[0-9X]$/;
  // ISBN-13: 13 chiffres commençant par 978 ou 979
  const isbn13Regex = /^97[89][0-9]{10}$/;

  if (cleanISBN.length === 10 && isbn10Regex.test(cleanISBN)) {
    return null; // ISBN-10 valide
  }

  if (cleanISBN.length === 13 && isbn13Regex.test(cleanISBN)) {
    return null; // ISBN-13 valide
  }

  return 'Format ISBN invalide (ISBN-10 ou ISBN-13 attendu, ex: 978-2-1234-5678-9)';
}

// ============================================================================
// VALIDATION CODES LANGUE (ISO 639-1)
// ============================================================================

/**
 * Codes langue ISO 639-1 courants
 */
const ISO_639_1_CODES = [
  'fr',
  'en',
  'es',
  'de',
  'it',
  'pt',
  'ar',
  'zh',
  'ja',
  'ko',
  'ru',
  'hi',
  'nl',
  'sv',
  'pl',
  'tr',
  'vi',
  'th',
  'id',
  'cs',
  'da',
  'fi',
  'hu',
  'no',
  'ro',
  'sk',
  'uk',
  'el',
  'he',
  'bg',
];

/**
 * Valide un code langue ISO 639-1
 *
 * @param language - Code langue à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateLanguageCode(language: string): string | null {
  if (!language || !language.trim()) return null; // Optionnel

  const code = language.trim().toLowerCase();

  // Vérifier si c'est un code ISO 639-1 valide (2 lettres)
  if (code.length === 2 && /^[a-z]{2}$/.test(code)) {
    // Accepter même si pas dans la liste (peut être un code valide non listé)
    return null;
  }

  // Accepter aussi les noms de langues complets (Français, English, etc.)
  if (code.length > 2 && /^[a-zA-ZàâäéèêëïîôùûüÿñçÀÂÄÉÈÊËÏÎÔÙÛÜŸÑÇ\s'-]+$/.test(language)) {
    return null;
  }

  return 'Format invalide (code ISO 639-1 de 2 lettres ou nom de langue, ex: fr, Français)';
}

// ============================================================================
// VALIDATION ANNÉE
// ============================================================================

/**
 * Valide une année
 *
 * @param year - Année à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateYear(year: number | null | undefined): string | null {
  if (year === null || year === undefined) return null; // Optionnel

  const currentYear = new Date().getFullYear();
  const minYear = 1000;
  const maxYear = currentYear + 1; // Permettre année future (pour publications)

  if (year < minYear || year > maxYear) {
    return `L'année doit être entre ${minYear} et ${maxYear}`;
  }

  return null;
}

// ============================================================================
// VALIDATION URLS
// ============================================================================

/**
 * Valide une URL générique
 *
 * @param url - URL à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateGenericURL(url: string): string | null {
  if (!url || !url.trim()) return null; // Optionnel

  const result = validateURL(url);
  if (!result.valid) {
    return result.error || "Format d'URL invalide";
  }

  return null;
}

/**
 * Valide une URL Instagram
 *
 * @param url - URL à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateInstagramURL(url: string): string | null {
  if (!url || !url.trim()) return null; // Optionnel

  const result = validateURL(url, { allowedDomains: ['instagram.com'] });
  if (!result.valid) {
    return result.error || 'URL Instagram invalide (doit contenir instagram.com)';
  }

  return null;
}

/**
 * Valide une URL Facebook
 *
 * @param url - URL à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateFacebookURL(url: string): string | null {
  if (!url || !url.trim()) return null; // Optionnel

  const result = validateURL(url, { allowedDomains: ['facebook.com', 'fb.com'] });
  if (!result.valid) {
    return result.error || 'URL Facebook invalide (doit contenir facebook.com ou fb.com)';
  }

  return null;
}

/**
 * Valide une URL Twitter/X
 *
 * @param url - URL à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateTwitterURL(url: string): string | null {
  if (!url || !url.trim()) return null; // Optionnel

  const result = validateURL(url, { allowedDomains: ['twitter.com', 'x.com'] });
  if (!result.valid) {
    return result.error || 'URL Twitter/X invalide (doit contenir twitter.com ou x.com)';
  }

  return null;
}

/**
 * Valide une URL YouTube
 *
 * @param url - URL à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateYouTubeURL(url: string): string | null {
  if (!url || !url.trim()) return null; // Optionnel

  const result = validateURL(url, { allowedDomains: ['youtube.com', 'youtu.be'] });
  if (!result.valid) {
    return result.error || 'URL YouTube invalide (doit contenir youtube.com ou youtu.be)';
  }

  return null;
}

// ============================================================================
// VALIDATION LONGUEUR
// ============================================================================

/**
 * Valide la longueur d'un champ
 *
 * @param value - Valeur à valider
 * @param min - Longueur minimale (optionnel)
 * @param max - Longueur maximale (optionnel)
 * @param fieldName - Nom du champ (pour message d'erreur)
 * @returns null si valide, message d'erreur sinon
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number,
  fieldName: string = 'Ce champ'
): string | null {
  if (!value) return null; // Optionnel si pas de min

  const length = value.trim().length;

  if (min !== undefined && length < min) {
    return `${fieldName} doit contenir au moins ${min} caractère${min > 1 ? 's' : ''}`;
  }

  if (max !== undefined && length > max) {
    return `${fieldName} ne peut pas dépasser ${max} caractères`;
  }

  return null;
}

// ============================================================================
// VALIDATION PRIX
// ============================================================================

/**
 * Valide un prix
 *
 * @param price - Prix à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validatePrice(price: number | null | undefined): string | null {
  if (price === null || price === undefined || price === 0) {
    return 'Le prix est requis et doit être supérieur à 0';
  }

  if (price < 0) {
    return 'Le prix ne peut pas être négatif';
  }

  if (price > 999999999.99) {
    return 'Le prix ne peut pas dépasser 999,999,999.99';
  }

  // Vérifier décimales (max 2)
  const decimals = price.toString().split('.')[1];
  if (decimals && decimals.length > 2) {
    return 'Le prix ne peut avoir que 2 décimales maximum';
  }

  return null;
}

/**
 * Valide un prix de comparaison (doit être >= prix)
 *
 * @param comparePrice - Prix de comparaison
 * @param regularPrice - Prix régulier
 * @returns null si valide, message d'erreur sinon
 */
export function validateComparePrice(
  comparePrice: number | null | undefined,
  regularPrice: number | null | undefined
): string | null {
  if (comparePrice === null || comparePrice === undefined) return null; // Optionnel

  if (comparePrice < 0) {
    return 'Le prix de comparaison ne peut pas être négatif';
  }

  if (regularPrice && comparePrice < regularPrice) {
    return 'Le prix de comparaison doit être supérieur ou égal au prix';
  }

  return null;
}

// ============================================================================
// VALIDATION DIMENSIONS
// ============================================================================

/**
 * Valide une dimension (largeur, hauteur)
 *
 * @param dimension - Dimension à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateDimension(dimension: number | null | undefined): string | null {
  if (dimension === null || dimension === undefined) return null; // Optionnel

  if (dimension < 0) {
    return 'La dimension ne peut pas être négative';
  }

  if (dimension > 10000) {
    return 'La dimension ne peut pas dépasser 10000';
  }

  // Vérifier décimales (max 2)
  const decimals = dimension.toString().split('.')[1];
  if (decimals && decimals.length > 2) {
    return 'La dimension ne peut avoir que 2 décimales maximum';
  }

  return null;
}

/**
 * Valide une unité de dimension
 *
 * @param unit - Unité à valider
 * @returns null si valide, message d'erreur sinon
 */
export function validateDimensionUnit(unit: string): string | null {
  if (!unit || !unit.trim()) return null; // Optionnel

  const validUnits = ['cm', 'm', 'inch', 'ft', 'mm'];
  const normalizedUnit = unit.trim().toLowerCase();

  if (!validUnits.includes(normalizedUnit)) {
    return `Unité invalide (valeurs acceptées: ${validUnits.join(', ')})`;
  }

  return null;
}

// ============================================================================
// VALIDATION ÉDITION
// ============================================================================

/**
 * Valide un numéro d'édition
 *
 * @param editionNumber - Numéro d'édition
 * @param totalEditions - Total d'éditions
 * @returns null si valide, message d'erreur sinon
 */
export function validateEditionNumber(
  editionNumber: number | null | undefined,
  totalEditions: number | null | undefined
): string | null {
  if (editionNumber === null || editionNumber === undefined) return null; // Optionnel

  if (editionNumber < 1) {
    return "Le numéro d'édition doit être au moins 1";
  }

  if (totalEditions && editionNumber > totalEditions) {
    return `Le numéro d'édition ne peut pas être supérieur au total (${totalEditions})`;
  }

  return null;
}

/**
 * Valide le total d'éditions
 *
 * @param totalEditions - Total d'éditions
 * @returns null si valide, message d'erreur sinon
 */
export function validateTotalEditions(totalEditions: number | null | undefined): string | null {
  if (totalEditions === null || totalEditions === undefined) return null; // Optionnel

  if (totalEditions < 1) {
    return "Le total d'éditions doit être au moins 1";
  }

  if (totalEditions > 1000000) {
    return "Le total d'éditions ne peut pas dépasser 1,000,000";
  }

  return null;
}

// ============================================================================
// VALIDATION PISTES ALBUM
// ============================================================================

/**
 * Valide la durée d'une piste (en secondes)
 *
 * @param duration - Durée en secondes
 * @returns null si valide, message d'erreur sinon
 */
export function validateTrackDuration(duration: number | null | undefined): string | null {
  if (duration === null || duration === undefined || duration === 0) return null; // Optionnel

  if (duration < 0) {
    return 'La durée ne peut pas être négative';
  }

  if (duration > 3600) {
    return 'La durée ne peut pas dépasser 3600 secondes (1 heure)';
  }

  return null;
}
