/**
 * Helpers pour les transformations d'images Supabase Storage.
 * Doc: https://supabase.com/docs/guides/storage/serving/image-transformations
 *
 * Point unique pour resize / qualité / format (AVIF|WebP) côté delivery.
 */

export type ImageFormat = 'origin' | 'webp' | 'avif';

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  resize?: 'cover' | 'contain' | 'fill';
  format?: ImageFormat;
}

export type ProductImageContext = 'grid' | 'detail' | 'thumbnail' | 'hero';

const SUPABASE_PUBLIC_REGEX = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
const SUPABASE_RENDER_REGEX = /\/storage\/v1\/render\/image\/public\/([^/]+)\/(.+)$/;

/** Cache navigateur : détection AVIF/WebP une seule fois. */
let cachedPreferredFormat: 'avif' | 'webp' | null | undefined;

export function getPreferredDeliveryFormat(): 'avif' | 'webp' | null {
  if (cachedPreferredFormat !== undefined) return cachedPreferredFormat;
  if (typeof document === 'undefined') {
    cachedPreferredFormat = null;
    return null;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      cachedPreferredFormat = 'avif';
    } else if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      cachedPreferredFormat = 'webp';
    } else {
      cachedPreferredFormat = null;
    }
  } catch {
    cachedPreferredFormat = null;
  }
  return cachedPreferredFormat;
}

export function getProductImageDimensions(
  context: ProductImageContext,
  propWidth?: number,
  propHeight?: number
): { width: number; height: number } {
  if (propWidth && propHeight) {
    return { width: propWidth, height: propHeight };
  }
  switch (context) {
    case 'thumbnail':
      return { width: 384, height: 256 };
    case 'detail':
      return { width: 1536, height: 1024 };
    case 'hero':
      return { width: 1600, height: 900 };
    default:
      return { width: 480, height: 320 };
  }
}

/**
 * Transforme une URL Supabase Storage en URL CDN avec resize/qualité.
 * - data:/blob:/non-Supabase → URL inchangée
 * - object/public → /render/image/public + query params
 * - render/image déjà présent → réécrit les params
 */
export function buildTransformedUrl(
  url: string | null | undefined,
  opts: TransformOptions = {}
): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  // Strip query first so rewrites of existing /render/image URLs don't glue params to the origin
  const cleanUrl = url.split('?')[0];
  const objectMatch = cleanUrl.match(SUPABASE_PUBLIC_REGEX);
  const renderMatch = !objectMatch ? cleanUrl.match(SUPABASE_RENDER_REGEX) : null;
  if (!objectMatch && !renderMatch) return url;

  const bucket = objectMatch ? objectMatch[1] : renderMatch![1];
  const path = objectMatch ? objectMatch[2] : renderMatch![2];
  const base = cleanUrl.replace(objectMatch ? SUPABASE_PUBLIC_REGEX : SUPABASE_RENDER_REGEX, '');

  const renderUrl = `${base}/storage/v1/render/image/public/${bucket}/${path}`;

  const format =
    opts.format && opts.format !== 'origin'
      ? opts.format
      : (getPreferredDeliveryFormat() ?? undefined);

  const params = new URLSearchParams();
  if (opts.width) params.set('width', String(Math.round(opts.width)));
  if (opts.height) params.set('height', String(Math.round(opts.height)));
  if (opts.quality) params.set('quality', String(Math.min(100, Math.max(20, opts.quality))));
  if (opts.resize) params.set('resize', opts.resize);
  if (format) params.set('format', format);

  const qs = params.toString();
  return qs ? `${renderUrl}?${qs}` : renderUrl;
}

/**
 * URL produit optimisée selon le contexte d'affichage.
 */
export function buildProductImageUrl(
  url: string | null | undefined,
  context: ProductImageContext = 'grid',
  opts: Partial<TransformOptions> & { width?: number; height?: number } = {}
): string {
  if (!url) return '';
  const dims = getProductImageDimensions(context, opts.width, opts.height);
  return buildTransformedUrl(url, {
    width: dims.width,
    height: dims.height,
    quality: opts.quality ?? (context === 'hero' ? 78 : 82),
    resize: opts.resize ?? 'cover',
    format: opts.format,
  });
}

/**
 * Génère un srcSet responsive pour un set de largeurs.
 */
export function buildSrcSet(
  url: string,
  widths: number[] = [320, 640, 960, 1280, 1920],
  opts: Omit<TransformOptions, 'width'> = {}
): string {
  return widths.map(w => `${buildTransformedUrl(url, { ...opts, width: w })} ${w}w`).join(', ');
}

/** srcSet produit (ratios 3:2 approximés via height optionnelle omise — width only). */
export function buildProductSrcSet(
  url: string,
  context: ProductImageContext = 'grid',
  opts: Omit<TransformOptions, 'width' | 'height'> = {}
): string {
  const widths =
    context === 'thumbnail'
      ? [192, 384, 576]
      : context === 'detail' || context === 'hero'
        ? [640, 960, 1280, 1600]
        : [240, 480, 720];
  return buildSrcSet(url, widths, {
    quality: opts.quality ?? 82,
    resize: opts.resize ?? 'cover',
    format: opts.format,
  });
}
