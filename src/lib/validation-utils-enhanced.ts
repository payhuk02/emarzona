/**
 * Utilitaires de validation et sanitization améliorés
 * Fournit des fonctions réutilisables pour valider et nettoyer les données
 */

export interface ValidationResult<T = any> {
  valid: boolean;
  value?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface SanitizeOptions {
  /**
   * Supprimer les espaces en début et fin
   * @default true
   */
  trim?: boolean;
  /**
   * Supprimer les caractères HTML
   * @default false
   */
  stripHtml?: boolean;
  /**
   * Convertir en minuscules
   * @default false
   */
  toLowerCase?: boolean;
  /**
   * Convertir en majuscules
   * @default false
   */
  toUpperCase?: boolean;
  /**
   * Normaliser les espaces multiples
   * @default false
   */
  normalizeWhitespace?: boolean;
  /**
   * Supprimer les caractères spéciaux
   * @default false
   */
  removeSpecialChars?: boolean;
  /**
   * Caractères autorisés (si removeSpecialChars est true)
   */
  allowedChars?: string;
}

/**
 * Sanitize une chaîne de caractères
 */
export function sanitizeString(
  input: string,
  options: SanitizeOptions = {}
): string {
  let result = input;

  const {
    trim = true,
    stripHtml = false,
    toLowerCase = false,
    toUpperCase = false,
    normalizeWhitespace = false,
    removeSpecialChars = false,
    allowedChars,
  } = options;

  if (trim) {
    result = result.trim();
  }

  if (stripHtml) {
    // Supprimer les balises HTML
    result = result.replace(/<[^>]*>/g, '');
    // Décoder les entités HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = result;
    result = tmp.textContent || tmp.innerText || '';
  }

  if (normalizeWhitespace) {
    result = result.replace(/\s+/g, ' ');
  }

  if (removeSpecialChars) {
    const pattern = allowedChars
      ? new RegExp(`[^${allowedChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g')
      : /[^a-zA-Z0-9\s]/g;
    result = result.replace(pattern, '');
  }

  if (toLowerCase) {
    result = result.toLowerCase();
  }

  if (toUpperCase) {
    result = result.toUpperCase();
  }

  return result;
}

/**
 * Valide un email
 */
export function validateEmail(email: string): ValidationResult<string> {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email requis' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const sanitized = sanitizeString(email, { trim: true, toLowerCase: true });

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }

  return { valid: true, value: sanitized };
}

/**
 * Valide une URL
 */
export function validateUrl(url: string): ValidationResult<string> {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL requise' };
  }

  const sanitized = sanitizeString(url, { trim: true });

  try {
    const urlObj = new URL(sanitized);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'L\'URL doit commencer par http:// ou https://' };
    }
    return { valid: true, value: sanitized };
  } catch {
    return { valid: false, error: 'Format d\'URL invalide' };
  }
}

/**
 * Valide un téléphone
 */
export function validatePhone(phone: string): ValidationResult<string> {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Téléphone requis' };
  }

  const sanitized = sanitizeString(phone, {
    trim: true,
    removeSpecialChars: true,
    allowedChars: '+0123456789',
  });

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(sanitized)) {
    return { valid: false, error: 'Format de téléphone invalide' };
  }

  return { valid: true, value: sanitized };
}

/**
 * Valide un slug
 */
export function validateSlug(slug: string): ValidationResult<string> {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug requis' };
  }

  const sanitized = sanitizeString(slug, {
    trim: true,
    toLowerCase: true,
    removeSpecialChars: true,
    allowedChars: 'abcdefghijklmnopqrstuvwxyz0123456789-',
  });

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(sanitized)) {
    return { valid: false, error: 'Format de slug invalide (minuscules, chiffres et tirets uniquement)' };
  }

  return { valid: true, value: sanitized };
}

/**
 * Valide une longueur de chaîne
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number
): ValidationResult<string> {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Valeur doit être une chaîne' };
  }

  const length = value.length;

  if (min !== undefined && length < min) {
    return { valid: false, error: `Minimum ${min} caractères requis` };
  }

  if (max !== undefined && length > max) {
    return { valid: false, error: `Maximum ${max} caractères autorisés` };
  }

  return { valid: true, value };
}

/**
 * Valide un nombre dans une plage
 */
export function validateRange(
  value: number,
  min?: number,
  max?: number
): ValidationResult<number> {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'Valeur doit être un nombre' };
  }

  if (min !== undefined && value < min) {
    return { valid: false, error: `Valeur doit être supérieure ou égale à ${min}` };
  }

  if (max !== undefined && value > max) {
    return { valid: false, error: `Valeur doit être inférieure ou égale à ${max}` };
  }

  return { valid: true, value };
}

/**
 * Valide plusieurs champs
 */
export function validateFields<T extends Record<string, any>>(
  fields: T,
  validators: Partial<Record<keyof T, (value: any) => ValidationResult>>
): ValidationResult<T> {
  const errors: Record<string, string> = {};
  const values: Partial<T> = {};

  for (const [key, value] of Object.entries(fields)) {
    const validator = validators[key as keyof T];
    if (validator) {
      const result = validator(value);
      if (!result.valid) {
        errors[key] = result.error || 'Validation échouée';
      } else if (result.value !== undefined) {
        values[key as keyof T] = result.value;
      } else {
        values[key as keyof T] = value;
      }
    } else {
      values[key as keyof T] = value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors, value: values as T };
  }

  return { valid: true, value: values as T };
}

/**
 * Valide un mot de passe
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): ValidationResult<string> {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false,
  } = options;

  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Mot de passe requis' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `Le mot de passe doit contenir au moins ${minLength} caractères` };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins une majuscule' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins une minuscule' };
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }

  if (requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins un caractère spécial' };
  }

  return { valid: true, value: password };
}

