/**
 * Helpers pour les transformations d'images Supabase Storage.
 * Doc: https://supabase.com/docs/guides/storage/serving/image-transformations
 *
 * Les buckets en Free plan supportent un fallback simple via ?width=&quality=
 * sur le endpoint /render/image/. Si l'URL n'est pas un asset Supabase,
 * on retourne l'URL d'origine telle quelle.
 */

export type ImageFormat = 'origin' | 'webp' | 'avif';

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  resize?: 'cover' | 'contain' | 'fill';
  format?: ImageFormat;
}

const SUPABASE_PUBLIC_REGEX =
  /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

/**
 * Transforme une URL Supabase Storage en URL CDN avec resize/qualité.
 * - Si l'URL n'est pas un objet public Supabase, retourne l'URL telle quelle.
 * - Si elle l'est, bascule sur /render/image/public/ avec les query params.
 */
export function buildTransformedUrl(
  url: string | null | undefined,
  opts: TransformOptions = {},
): string {
  if (!url) return '';
  // Asset local ou data URI: on ne touche pas
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  const match = url.match(SUPABASE_PUBLIC_REGEX);
  if (!match) return url;

  const [, bucket, path] = match;
  const base = url.replace(SUPABASE_PUBLIC_REGEX, '');
  const renderUrl = `${base}/storage/v1/render/image/public/${bucket}/${path}`;

  const params = new URLSearchParams();
  if (opts.width) params.set('width', String(Math.round(opts.width)));
  if (opts.height) params.set('height', String(Math.round(opts.height)));
  if (opts.quality) params.set('quality', String(Math.min(100, Math.max(20, opts.quality))));
  if (opts.resize) params.set('resize', opts.resize);
  if (opts.format && opts.format !== 'origin') params.set('format', opts.format);

  const qs = params.toString();
  return qs ? `${renderUrl}?${qs}` : renderUrl;
}

/**
 * Génère un srcSet responsive pour un set de largeurs.
 */
export function buildSrcSet(
  url: string,
  widths: number[] = [320, 640, 960, 1280, 1920],
  opts: Omit<TransformOptions, 'width'> = {},
): string {
  return widths
    .map((w) => `${buildTransformedUrl(url, { ...opts, width: w })} ${w}w`)
    .join(', ');
}
