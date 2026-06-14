/**
 * Epic 4.1 — Cache clés SEO middleware (bots)
 * Normalise host + pathname ; ignore les params de tracking.
 */

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'ref',
  'mc_cid',
  'mc_eid',
]);

export const META_CACHE_TTL_SECONDS = 600; // 10 min
export const BOT_RATE_LIMIT_PER_MINUTE = 120;
export const BOT_RATE_WINDOW_SECONDS = 60;

export interface CachedMetaPayload {
  meta: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: 'website' | 'product' | 'profile';
    price?: number;
    currency?: string;
  };
  cachedAt: number;
}

/** Clé stable pour Redis / cache edge (host + path canonique). */
export function buildMetaCacheKey(requestUrl: string): string {
  const url = new URL(requestUrl);
  const host = (url.host || '').toLowerCase();
  const path = url.pathname || '/';

  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) {
      kept.set(key, value);
    }
  });

  const qs = kept.toString();
  return `seo:meta:v1:${host}${path}${qs ? `?${qs}` : ''}`;
}

export function buildBotRateLimitKey(clientIp: string): string {
  const ip = (clientIp || 'unknown').trim().toLowerCase();
  return `seo:botrl:v1:${ip}`;
}

export function serializeCachedMeta(payload: CachedMetaPayload): string {
  return JSON.stringify(payload);
}

export function parseCachedMeta(raw: string | null | undefined): CachedMetaPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedMetaPayload;
    if (!parsed?.meta?.title || typeof parsed.cachedAt !== 'number') return null;
    if (Date.now() - parsed.cachedAt > META_CACHE_TTL_SECONDS * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isPlatformHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === 'emarzona.com' ||
    h === 'www.emarzona.com' ||
    h === 'localhost' ||
    h.endsWith('.vercel.app')
  );
}

export function isStoreWildcardHost(host: string, storeDomain = 'myemarzona.shop'): boolean {
  const h = host.toLowerCase();
  return h === storeDomain || h.endsWith(`.${storeDomain}`);
}

/** Hôte probablement custom domain vendeur (hors plateforme et wildcard). */
export function isLikelyCustomStoreHost(host: string, storeDomain = 'myemarzona.shop'): boolean {
  const h = host.toLowerCase();
  if (!h || h.includes('localhost')) return false;
  if (isPlatformHost(h)) return false;
  if (isStoreWildcardHost(h, storeDomain)) return false;
  return h.includes('.');
}
