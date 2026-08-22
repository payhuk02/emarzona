import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const KYC_DOCUMENTS_BUCKET = 'kyc-documents';
export const KYC_DEFAULT_CITY = 'Ouagadougou';
export const KYC_DEFAULT_COUNTRY = 'Burkina Faso';

export function kycErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

const KYC_PUBLIC_URL_RE = /\/storage\/v1\/object\/public\/kyc-documents\/(.+)$/;
const KYC_SIGNED_URL_RE = /\/storage\/v1\/object\/sign\/kyc-documents\/(.+?)(?:\?|$)/;

export function extractKycDocumentPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const value = stored.trim();
  if (!value) return null;

  const publicMatch = value.match(KYC_PUBLIC_URL_RE);
  if (publicMatch?.[1]) return decodeURIComponent(publicMatch[1]);

  const signedMatch = value.match(KYC_SIGNED_URL_RE);
  if (signedMatch?.[1]) return decodeURIComponent(signedMatch[1]);

  if (value.startsWith('http://') || value.startsWith('https://')) return null;
  return value.replace(/^kyc-documents\//, '');
}

export async function resolveKycDocumentUrl(
  stored: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> {
  if (!stored) return null;
  const path = extractKycDocumentPath(stored);
  if (!path) return stored.startsWith('http') ? stored : null;

  const { data, error } = await supabase.storage
    .from(KYC_DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    logger.warn('Failed to sign KYC document URL', { error, path });
    return stored.startsWith('http') ? stored : null;
  }
  return data.signedUrl;
}
