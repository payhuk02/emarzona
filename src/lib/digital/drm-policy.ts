/**
 * DRM digital v2 — téléchargements acheteur via tokens éphémères uniquement.
 * Voir : redeem-download-token Edge + /download/:token
 */

export const BUYER_DOWNLOAD_REDEEM_PATH = '/download/:token' as const;
export const DEFAULT_DOWNLOAD_TOKEN_TTL_SECONDS = 3600;

export type BuyerDownloadMethod = 'token-redeem' | 'direct-signed-url';

/** Chemin autorisé pour les acheteurs (production truth). */
export function isAllowedBuyerDownloadMethod(method: BuyerDownloadMethod): boolean {
  return method === 'token-redeem';
}

export function assertBuyerDownloadMethod(method: BuyerDownloadMethod): void {
  if (!isAllowedBuyerDownloadMethod(method)) {
    throw new Error(
      'DRM v2 : les téléchargements acheteur doivent passer par un token (/download/:token), pas une URL signée directe.'
    );
  }
}

/** Indique si un chemin storage doit être servi via Edge (bucket privé products). */
export function requiresTokenRedemptionForPrivateBucket(bucket: string): boolean {
  return bucket === 'products';
}

export function buildDownloadRedeemPageUrl(token: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com');
  return `${base.replace(/\/$/, '')}/download/${encodeURIComponent(token)}`;
}
