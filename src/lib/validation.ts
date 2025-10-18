/**
 * Utilitaires de validation et de sécurité
 */

/**
 * Valide une adresse email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone (format international)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Sanitise une chaîne de caractères pour éviter les injections
 */
export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Supprime les balises HTML
    .replace(/['"]/g, '') // Supprime les guillemets
    .trim();
};

/**
 * Valide un slug (nom d'URL)
 */
export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 50;
};

/**
 * Génère un slug valide à partir d'un nom
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Valide un montant (nombre positif)
 */
export const isValidAmount = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0 && amount < 1000000;
};

/**
 * Valide une URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Échappe les caractères spéciaux pour les requêtes SQL (protection supplémentaire)
 */
export const escapeSqlString = (str: string): string => {
  return str.replace(/'/g, "''");
};

/**
 * Valide un ID UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
