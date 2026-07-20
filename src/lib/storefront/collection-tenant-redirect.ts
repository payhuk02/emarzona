/**
 * Redirection collections marketplace → host tenant (Sprint 4).
 */

import { generateStoreUrl } from '@/lib/store-utils';

export function isStoreTenantHostname(hostname = window.location.hostname): boolean {
  const host = hostname.toLowerCase();
  if (host.endsWith('.myemarzona.shop')) return true;
  if (host === 'localhost' || host === '127.0.0.1') return false;
  // Custom domains are treated as tenant hosts (not apex marketplace)
  if (host === 'www.emarzona.com' || host === 'emarzona.com') return false;
  if (host.includes('emarzona.com')) return false;
  return false;
}

export function buildTenantCollectionUrl(params: {
  storeSlug: string;
  storeSubdomain?: string | null;
  customDomain?: string | null;
  collectionSlug: string;
}): string {
  const base = generateStoreUrl(
    params.storeSlug,
    params.storeSubdomain,
    params.customDomain ?? undefined
  );
  return `${base}/collections/${encodeURIComponent(params.collectionSlug)}`;
}

/** True when marketplace apex should bounce to tenant host. */
export function shouldRedirectCollectionToTenant(params: {
  storeSlugFromQuery: string | null;
  collectionSlug: string | null;
  hostname?: string;
}): boolean {
  if (!params.storeSlugFromQuery?.trim() || !params.collectionSlug?.trim()) return false;
  return !isStoreTenantHostname(params.hostname);
}
