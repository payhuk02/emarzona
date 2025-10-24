/**
 * Utilitaires de validation pour emails, URLs, téléphones
 * Avec sanitization et messages d'erreur en français
 */

// ==================== REGEX PATTERNS ====================

// Email : RFC 5322 simplifié
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// URL : HTTP/HTTPS avec domaine valide
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Téléphone international (avec ou sans +)
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

// Slug : lettres minuscules, chiffres, tirets
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ==================== TYPES ====================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export interface EmailValidationOptions {
  required?: boolean;
  allowedDomains?: string[]; // ex: ['gmail.com', 'yahoo.com']
  blockedDomains?: string[]; // ex: ['tempmail.com']
}

export interface URLValidationOptions {
  required?: boolean;
  protocols?: ('http' | 'https')[];
  allowedDomains?: string[];
}

export interface PhoneValidationOptions {
  required?: boolean;
  countryCodes?: string[]; // ex: ['+225', '+33']
}

export interface SlugValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  reserved?: string[]; // Slugs réservés (admin, api, etc.)
}

// ==================== SANITIZATION ====================

/**
 * Nettoie une chaîne de caractères (XSS prevention)
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Enlever < et >
    .replace(/javascript:/gi, '') // Enlever javascript:
    .replace(/on\w+=/gi, ''); // Enlever les événements (onclick=, etc.)
};

/**
 * Nettoie un email
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Nettoie une URL
 */
export const sanitizeURL = (url: string): string => {
  let cleaned = url.trim();
  
  // Ajouter https:// si pas de protocole
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  
  return cleaned;
};

/**
 * Nettoie un numéro de téléphone
 */
export const sanitizePhone = (phone: string): string => {
  return phone.trim().replace(/\s+/g, ''); // Enlever les espaces
};

/**
 * Nettoie un slug
 */
export const sanitizeSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9\s-]/g, '') // Enlever caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Réduire tirets multiples
    .replace(/^-+|-+$/g, ''); // Enlever tirets début/fin
};

// ==================== VALIDATIONS ====================

/**
 * Valide un email
 */
export const validateEmail = (
  email: string,
  options: EmailValidationOptions = {}
): ValidationResult => {
  const { required = false, allowedDomains, blockedDomains } = options;

  // Champ vide
  if (!email || !email.trim()) {
    if (required) {
      return { valid: false, error: 'L\'email est requis' };
    }
    return { valid: true, sanitized: '' };
  }

  const sanitized = sanitizeEmail(email);

  // Format email
  if (!EMAIL_REGEX.test(sanitized)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }

  const domain = sanitized.split('@')[1];

  // Domaines autorisés
  if (allowedDomains && allowedDomains.length > 0) {
    if (!allowedDomains.includes(domain)) {
      return {
        valid: false,
        error: `Seuls les domaines suivants sont autorisés : ${allowedDomains.join(', ')}`
      };
    }
  }

  // Domaines bloqués
  if (blockedDomains && blockedDomains.includes(domain)) {
    return {
      valid: false,
      error: 'Ce domaine email n\'est pas autorisé'
    };
  }

  return { valid: true, sanitized };
};

/**
 * Valide une URL
 */
export const validateURL = (
  url: string,
  options: URLValidationOptions = {}
): ValidationResult => {
  const { required = false, protocols = ['http', 'https'], allowedDomains } = options;

  // Champ vide
  if (!url || !url.trim()) {
    if (required) {
      return { valid: false, error: 'L\'URL est requise' };
    }
    return { valid: true, sanitized: '' };
  }

  const sanitized = sanitizeURL(url);

  // Format URL
  if (!URL_REGEX.test(sanitized)) {
    return { valid: false, error: 'Format d\'URL invalide (ex: https://example.com)' };
  }

  try {
    const urlObj = new URL(sanitized);

    // Protocole autorisé
    const protocol = urlObj.protocol.replace(':', '');
    if (!protocols.includes(protocol as any)) {
      return {
        valid: false,
        error: `Seuls les protocoles ${protocols.join(', ')} sont autorisés`
      };
    }

    // Domaines autorisés
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = urlObj.hostname.replace('www.', '');
      const isAllowed = allowedDomains.some((domain) => hostname.includes(domain));
      
      if (!isAllowed) {
        return {
          valid: false,
          error: `Seuls les domaines ${allowedDomains.join(', ')} sont autorisés`
        };
      }
    }

    return { valid: true, sanitized };
  } catch {
    return { valid: false, error: 'URL invalide' };
  }
};

/**
 * Valide un numéro de téléphone
 */
export const validatePhone = (
  phone: string,
  options: PhoneValidationOptions = {}
): ValidationResult => {
  const { required = false, countryCodes } = options;

  // Champ vide
  if (!phone || !phone.trim()) {
    if (required) {
      return { valid: false, error: 'Le numéro de téléphone est requis' };
    }
    return { valid: true, sanitized: '' };
  }

  const sanitized = sanitizePhone(phone);

  // Format téléphone
  if (!PHONE_REGEX.test(sanitized)) {
    return {
      valid: false,
      error: 'Format de téléphone invalide (ex: +225XXXXXXXX)'
    };
  }

  // Indicatifs pays autorisés
  if (countryCodes && countryCodes.length > 0) {
    const hasValidCode = countryCodes.some((code) => sanitized.startsWith(code));
    
    if (!hasValidCode) {
      return {
        valid: false,
        error: `Indicatif pays autorisé : ${countryCodes.join(', ')}`
      };
    }
  }

  return { valid: true, sanitized };
};

/**
 * Valide un slug
 */
export const validateSlug = (
  slug: string,
  options: SlugValidationOptions = {}
): ValidationResult => {
  const {
    required = false,
    minLength = 3,
    maxLength = 50,
    reserved = ['admin', 'api', 'app', 'www', 'mail', 'static', 'assets', 'public']
  } = options;

  // Champ vide
  if (!slug || !slug.trim()) {
    if (required) {
      return { valid: false, error: 'Le slug est requis' };
    }
    return { valid: true, sanitized: '' };
  }

  const sanitized = sanitizeSlug(slug);

  // Longueur minimale
  if (sanitized.length < minLength) {
    return {
      valid: false,
      error: `Le slug doit contenir au moins ${minLength} caractères`
    };
  }

  // Longueur maximale
  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `Le slug ne peut pas dépasser ${maxLength} caractères`
    };
  }

  // Format slug
  if (!SLUG_REGEX.test(sanitized)) {
    return {
      valid: false,
      error: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'
    };
  }

  // Slugs réservés
  if (reserved.includes(sanitized)) {
    return {
      valid: false,
      error: 'Ce slug est réservé et ne peut pas être utilisé'
    };
  }

  return { valid: true, sanitized };
};

/**
 * Valide plusieurs URLs de réseaux sociaux
 */
export const validateSocialURLs = (urls: {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Facebook
  if (urls.facebook) {
    const result = validateURL(urls.facebook, {
      allowedDomains: ['facebook.com', 'fb.com']
    });
    if (!result.valid) {
      errors.facebook = result.error || 'URL Facebook invalide';
    }
  }

  // Instagram
  if (urls.instagram) {
    const result = validateURL(urls.instagram, {
      allowedDomains: ['instagram.com']
    });
    if (!result.valid) {
      errors.instagram = result.error || 'URL Instagram invalide';
    }
  }

  // Twitter/X
  if (urls.twitter) {
    const result = validateURL(urls.twitter, {
      allowedDomains: ['twitter.com', 'x.com']
    });
    if (!result.valid) {
      errors.twitter = result.error || 'URL Twitter invalide';
    }
  }

  // LinkedIn
  if (urls.linkedin) {
    const result = validateURL(urls.linkedin, {
      allowedDomains: ['linkedin.com']
    });
    if (!result.valid) {
      errors.linkedin = result.error || 'URL LinkedIn invalide';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ==================== HELPERS ====================

/**
 * Génère un slug à partir d'un texte
 */
export const generateSlug = (text: string): string => {
  return sanitizeSlug(text);
};

/**
 * Valide un formulaire complet de boutique
 */
export interface StoreFormData {
  name: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
}

export const validateStoreForm = (
  data: StoreFormData
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Nom requis
  if (!data.name || !data.name.trim()) {
    errors.name = 'Le nom de la boutique est requis';
  }

  // Email
  if (data.contact_email) {
    const emailResult = validateEmail(data.contact_email);
    if (!emailResult.valid) {
      errors.contact_email = emailResult.error || 'Email invalide';
    }
  }

  // Téléphone
  if (data.contact_phone) {
    const phoneResult = validatePhone(data.contact_phone, {
      countryCodes: ['+225', '+33', '+1', '+221', '+237', '+226', '+223']
    });
    if (!phoneResult.valid) {
      errors.contact_phone = phoneResult.error || 'Téléphone invalide';
    }
  }

  // Réseaux sociaux
  const socialResult = validateSocialURLs({
    facebook: data.facebook_url,
    instagram: data.instagram_url,
    twitter: data.twitter_url,
    linkedin: data.linkedin_url
  });

  if (!socialResult.valid) {
    Object.assign(errors, socialResult.errors);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

