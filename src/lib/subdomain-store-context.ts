import { detectSubdomain } from '@/lib/subdomain-detector';

/** True when browsing a vendor store on *.myemarzona.shop or verified custom domain. */
export function isStoreSubdomainContext(): boolean {
  const info = detectSubdomain();
  if (info.isPlatformDomain) return false;
  if (info.isCustomDomain && info.customDomain) return true;
  return Boolean(info.isStoreDomain && info.isSubdomain && info.subdomain);
}
