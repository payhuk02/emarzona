import { supabase } from '@/integrations/supabase/client';
import { fileNameFromRef } from '@/lib/digital/storage-ref';

export interface RedeemDownloadTokenResult {
  signedUrl: string;
  fileName: string;
  expiresInSeconds: number;
  external: boolean;
}

export interface RedeemDownloadTokenError {
  error: string;
  code?: string;
}

/**
 * Redeems a download token via Edge Function (service role signs private storage objects).
 */
export async function redeemDownloadToken(
  token: string
): Promise<
  { ok: true; data: RedeemDownloadTokenResult } | { ok: false; error: RedeemDownloadTokenError }
> {
  const { data, error } = await supabase.functions.invoke('redeem-download-token', {
    body: { token },
  });

  if (error) {
    return {
      ok: false,
      error: { error: error.message || 'Impossible de valider le lien de téléchargement.' },
    };
  }

  const payload = data as RedeemDownloadTokenResult | RedeemDownloadTokenError | null | undefined;

  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: { error: 'Réponse serveur invalide.' },
    };
  }

  if ('error' in payload && payload.error) {
    return {
      ok: false,
      error: { error: String(payload.error), code: payload.code },
    };
  }

  if (!('signedUrl' in payload) || !payload.signedUrl) {
    return {
      ok: false,
      error: { error: 'URL de téléchargement indisponible.' },
    };
  }

  return {
    ok: true,
    data: {
      signedUrl: payload.signedUrl,
      fileName: payload.fileName || fileNameFromRef(payload.signedUrl),
      expiresInSeconds: payload.expiresInSeconds ?? 3600,
      external: Boolean(payload.external),
    },
  };
}
