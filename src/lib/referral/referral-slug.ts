/**
 * Slug de parrainage court : emarzona.com/p/abcdef
 * 4–20 caractères, lettres minuscules et chiffres.
 */

export const REFERRAL_SLUG_MIN_LENGTH = 4;
export const REFERRAL_SLUG_MAX_LENGTH = 20;
export const REFERRAL_SLUG_PATTERN = /^[a-z0-9]+$/;

const RESERVED_REFERRAL_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'emarzona',
  'help',
  'login',
  'marketplace',
  'pay',
  'payhuk',
  'register',
  'signup',
  'support',
  'www',
]);

export function normalizeReferralSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function isReservedReferralSlug(slug: string): boolean {
  return RESERVED_REFERRAL_SLUGS.has(normalizeReferralSlug(slug));
}

export function validateReferralSlug(raw: string): string | null {
  const slug = normalizeReferralSlug(raw);
  if (slug.length < REFERRAL_SLUG_MIN_LENGTH || slug.length > REFERRAL_SLUG_MAX_LENGTH) {
    return `Le code doit contenir entre ${REFERRAL_SLUG_MIN_LENGTH} et ${REFERRAL_SLUG_MAX_LENGTH} caractères (lettres ou chiffres).`;
  }
  if (!REFERRAL_SLUG_PATTERN.test(slug)) {
    return 'Utilisez uniquement des lettres minuscules et des chiffres, sans espace.';
  }
  if (isReservedReferralSlug(slug)) {
    return 'Ce code est réservé. Choisissez-en un autre.';
  }
  return null;
}
