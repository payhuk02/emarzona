import { normalizeReferralSlug } from '@/lib/referral/referral-slug';

const CANONICAL_REFERRAL_HOST = 'emarzona.com';

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  );
}

/**
 * Origine du lien copié = l’hôte réel (www.emarzona.com, preview, localhost).
 * On ne force pas l’apex : un lien https://emarzona.com/... casserait si seul www est servi.
 */
export function getReferralLinkOrigin(): string {
  if (typeof window === 'undefined') {
    return `https://www.${CANONICAL_REFERRAL_HOST}`;
  }

  const { hostname, origin } = window.location;
  if (isLocalHost(hostname) || hostname.includes('vercel.app')) {
    return origin;
  }

  return origin.replace(/\/$/, '');
}

export function buildReferralShortPath(code: string): string {
  return `/p/${normalizeReferralSlug(code)}`;
}

/** Lien court professionnel : https://emarzona.com/p/abcdef */
export function buildReferralShortUrl(code: string): string {
  const slug = normalizeReferralSlug(code);
  if (!slug) return getReferralLinkOrigin();
  return `${getReferralLinkOrigin()}${buildReferralShortPath(slug)}`;
}

export function extractReferralCodeFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/p\/([A-Za-z0-9]{2,32})\/?$/i);
  const code = match?.[1]?.trim();
  return code || null;
}
