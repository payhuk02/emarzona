/**
 * Helper: génère l'URL d'une image Open Graph dynamique.
 * Pointe vers l'edge function Supabase `og-image`.
 *
 * @example
 *   getDynamicOgImage({ title: 'Mon produit', subtitle: 'Boutique Demo', type: 'product' })
 */

const SUPABASE_PROJECT_ID =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) ?? 'hbdnzajbyjakdhuavrvb';

const OG_ENDPOINT = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/og-image`;

export type OgImageType = 'product' | 'store' | 'course' | 'page';

export interface OgImageOptions {
  title: string;
  subtitle?: string;
  type?: OgImageType;
}

export function getDynamicOgImage({ title, subtitle, type = 'page' }: OgImageOptions): string {
  const params = new URLSearchParams({ title, type });
  if (subtitle) params.set('subtitle', subtitle);
  return `${OG_ENDPOINT}?${params.toString()}`;
}