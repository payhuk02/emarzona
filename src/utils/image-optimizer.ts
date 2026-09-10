/**
 * Utilitaires pour l'optimisation des images
 * Gère le chargement des versions optimisées (WebP/AVIF) avec fallback
 */

import { buildTransformedUrl } from '@/lib/images/supabaseTransform';

/**
 * Vérifie le support WebP du navigateur
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Vérifie le support AVIF du navigateur
 */
export function supportsAVIF(): boolean {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
}

/**
 * Génère le srcset pour les images responsives (assets locaux pré-générés)
 */
export function generateResponsiveSrcSet(
  baseName: string,
  basePath: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920],
  format: 'webp' | 'avif' = 'webp'
): string {
  const formatExt = format === 'avif' ? '.avif' : '.webp';
  return sizes
    .map(size => {
      const optimizedPath = basePath.replace('/assets/', '/assets/optimized/');
      const fileName = `${baseName}-${size}w${formatExt}`;
      return `${optimizedPath.replace(/\/[^/]+$/, '')}/${fileName} ${size}w`;
    })
    .join(', ');
}

/**
 * Génère l'attribut sizes pour les images responsives
 */
export function generateSizes(breakpoints: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string {
  const parts: string[] = [];

  if (breakpoints.mobile) {
    parts.push(`(max-width: 768px) ${breakpoints.mobile}`);
  }
  if (breakpoints.tablet) {
    parts.push(`(max-width: 1024px) ${breakpoints.tablet}`);
  }
  if (breakpoints.desktop) {
    parts.push(breakpoints.desktop);
  }

  return parts.length > 0 ? parts.join(', ') : '100vw';
}

/**
 * Obtient l'URL optimisée d'une image avec fallback
 */
export function getOptimizedImageUrl(
  originalPath: string,
  options: {
    format?: 'webp' | 'avif' | 'auto' | 'origin';
    width?: number;
    quality?: number;
  } = {}
): string {
  const { format = 'auto', width, quality = 85 } = options;

  // Supabase Storage → /render/image/public (y compris URLs https complètes)
  if (
    originalPath.includes('/storage/v1/object/public/') ||
    originalPath.includes('/storage/v1/render/image/public/')
  ) {
    let resolvedFormat: 'webp' | 'avif' | 'origin' | undefined;
    if (format === 'webp' || format === 'avif' || format === 'origin') {
      resolvedFormat = format;
    } else if (format === 'auto') {
      resolvedFormat = undefined; // buildTransformedUrl choisit AVIF/WebP
    }
    return buildTransformedUrl(originalPath, {
      width,
      quality,
      format: resolvedFormat,
    });
  }

  // URL externe non-Supabase
  if (originalPath.startsWith('http://') || originalPath.startsWith('https://')) {
    return originalPath;
  }

  let targetFormat = 'webp';
  if (format === 'avif' && supportsAVIF()) {
    targetFormat = 'avif';
  } else if (format === 'auto') {
    if (supportsAVIF()) {
      targetFormat = 'avif';
    } else if (supportsWebP()) {
      targetFormat = 'webp';
    } else {
      return originalPath;
    }
  } else if (format === 'webp') {
    targetFormat = 'webp';
  }

  const optimizedPath = originalPath
    .replace('/assets/', '/assets/optimized/')
    .replace(/\.(jpg|jpeg|png)$/i, `.${targetFormat}`);

  if (width) {
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    const closestSize = sizes.reduce((prev, curr) =>
      Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
    );
    return optimizedPath.replace(`.${targetFormat}`, `-${closestSize}w.${targetFormat}`);
  }

  return optimizedPath;
}

/**
 * Hook pour obtenir les URLs optimisées d'une image
 */
export function useOptimizedImage(
  originalPath: string,
  options: {
    format?: 'webp' | 'avif' | 'auto';
    responsive?: boolean;
    sizes?: number[];
  } = {}
) {
  const {
    format = 'auto',
    responsive = false,
    sizes = [320, 640, 768, 1024, 1280, 1920],
  } = options;

  const baseName =
    originalPath
      .split('/')
      .pop()
      ?.replace(/\.(jpg|jpeg|png)$/i, '') || '';
  const basePath = originalPath.replace(/\/[^/]+$/, '');

  const optimizedUrl = getOptimizedImageUrl(originalPath, { format });

  const srcSet = responsive
    ? generateResponsiveSrcSet(baseName, basePath, sizes, format === 'auto' ? 'webp' : format)
    : undefined;

  return {
    src: optimizedUrl,
    srcSet,
    fallback: originalPath,
    supportsWebP: supportsWebP(),
    supportsAVIF: supportsAVIF(),
  };
}
