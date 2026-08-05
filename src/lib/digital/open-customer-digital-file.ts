import { redeemDownloadToken } from '@/lib/digital/redeem-download';
import { buildDownloadRedeemPageUrl } from '@/lib/digital/drm-policy';
import { parseFileRef } from '@/lib/digital/storage-ref';

export type GeneratedDownloadLink = {
  url?: string | null;
  token?: string | null;
};

export type OpenCustomerDigitalFileResult = {
  mode: 'external' | 'redeem-page';
};

/**
 * Opens a minted download token: external URLs directly, storage via /download/:token.
 */
export async function openCustomerDigitalFile(
  result: GeneratedDownloadLink,
  fileUrl?: string | null
): Promise<OpenCustomerDigitalFileResult> {
  const token = result.token ?? null;
  const redeemPageUrl =
    result.url || (token ? buildDownloadRedeemPageUrl(token, window.location.origin) : null);

  if (!token && !redeemPageUrl) {
    throw new Error('Impossible de générer le lien de téléchargement');
  }

  const isExternalLink = fileUrl ? parseFileRef(fileUrl).kind === 'external' : false;

  if (token && isExternalLink) {
    const redeemed = await redeemDownloadToken(token);
    if (!redeemed.ok) {
      throw new Error(redeemed.error.error);
    }

    const opened = window.open(redeemed.data.signedUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.assign(redeemed.data.signedUrl);
    }
    return { mode: 'external' };
  }

  if (redeemPageUrl) {
    const opened = window.open(redeemPageUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.assign(redeemPageUrl);
    }
    return { mode: 'redeem-page' };
  }

  throw new Error("Impossible d'ouvrir le fichier");
}
