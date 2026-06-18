import { normalizeFileStorageRef } from './storage-ref.ts';

const DEFAULT_EMAIL_TOKEN_EXPIRES_HOURS = 48;

/**
 * Mints a secure download page URL for order confirmation emails (service role).
 */
export async function mintOrderDownloadLink(
  supabase: {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  },
  options: {
    siteUrl: string;
    productId: string;
    fileUrl: string;
    customerId: string;
    licenseId?: string | null;
    expiresHours?: number;
  }
): Promise<string | null> {
  const canonicalFileRef = normalizeFileStorageRef(options.fileUrl);
  if (!canonicalFileRef) return null;

  const expiresHours = Math.max(1, options.expiresHours ?? DEFAULT_EMAIL_TOKEN_EXPIRES_HOURS);

  const { data: token, error } = await supabase.rpc('generate_download_token', {
    p_product_id: options.productId,
    p_file_url: canonicalFileRef,
    p_customer_id: options.customerId,
    p_license_id: options.licenseId ?? null,
    p_expires_hours: expiresHours,
  });

  if (error || !token) {
    console.warn('[mintOrderDownloadLink] token generation failed', {
      productId: options.productId,
      message: error?.message,
    });
    return null;
  }

  const baseUrl = options.siteUrl.replace(/\/+$/, '');
  return `${baseUrl}/download/${String(token)}`;
}
