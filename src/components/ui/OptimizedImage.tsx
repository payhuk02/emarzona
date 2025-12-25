/**
 * Composant Image Optimisé
 * - Lazy loading automatique avec IntersectionObserver
 * - Support WebP/AVIF avec fallback
 * - srcset pour différentes résolutions
 * - Placeholder blur pendant le chargement
 * - Skeleton pendant le chargement
 * - Optimisé pour mobile et desktop
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /**
   * Sizes pour responsive images
   * Ex: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
   */
  sizes?: string;
  /**
   * Qualité de l'image (1-100)
   * @default 80
   */
  quality?: number;
  /**
   * Afficher un placeholder blur pendant le chargement
   * @default true
   */
  showPlaceholder?: boolean;
  /**
   * Afficher un skeleton pendant le chargement
   * @default false
   */
  showSkeleton?: boolean;
  /**
   * Classe CSS pour le conteneur
   */
  containerClassName?: string;
  /**
   * Classe CSS pour l'image
   */
  imageClassName?: string;
  /**
   * Priorité de chargement (high = pas de lazy loading)
   * @default false
   */
  priority?: boolean;
  /**
   * Format d'image préféré (webp, avif, auto)
   * @default 'auto'
   */
  format?: 'webp' | 'avif' | 'auto';
}

/**
 * Génère l'URL optimisée de l'image avec support WebP/AVIF
 * OPTIMISATION: Cherche automatiquement les versions optimisées dans /optimized/
 */
function getOptimizedImageUrl(
  src: string,
  width?: number,
  quality: number = 80,
  format?: 'webp' | 'avif' | 'auto'
): string {
  // Si l'image est déjà une URL complète avec paramètres, la retourner telle quelle
  if (src.includes('?') || src.includes('&')) {
    return src;
  }

  // Si Supabase Storage, utiliser les transformations
  if (src.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    params.set('quality', quality.toString());

    // Support format moderne
    if (format === 'webp' || (format === 'auto' && supportsWebP())) {
      params.set('format', 'webp');
    } else if (format === 'avif' && supportsAVIF()) {
      params.set('format', 'avif');
    }

    return `${src}?${params.toString()}`;
  }

  // OPTIMISATION: Pour les images locales, chercher la version optimisée
  // Si l'image est importée depuis src/assets/, chercher dans src/assets/optimized/
  if (src.includes('/assets/') && !src.includes('/optimized/')) {
    const ext = src.split('.').pop()?.toLowerCase();
    const baseName =
      src
        .split('/')
        .pop()
        ?.replace(/\.(jpg|jpeg|png)$/i, '') || '';

    // Déterminer le format optimal
    let targetFormat = 'webp';
    if (format === 'avif' && supportsAVIF()) {
      targetFormat = 'avif';
    } else if (format === 'auto') {
      if (supportsAVIF()) {
        targetFormat = 'avif';
      } else if (supportsWebP()) {
        targetFormat = 'webp';
      } else {
        return src; // Fallback vers l'original
      }
    }

    // Construire le chemin vers l'image optimisée
    const optimizedPath = src
      .replace('/assets/', '/assets/optimized/')
      .replace(/\.(jpg|jpeg|png)$/i, `.${targetFormat}`);

    // Si une largeur est spécifiée, utiliser la version responsive
    if (width) {
      // Trouver la taille la plus proche
      const sizes = [320, 640, 768, 1024, 1280, 1920];
      const closestSize = sizes.reduce((prev, curr) =>
        Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
      );
      return optimizedPath.replace(`.${targetFormat}`, `-${closestSize}w.${targetFormat}`);
    }

    // Retourner la version optimisée (le navigateur utilisera le fallback si elle n'existe pas)
    return optimizedPath;
  }

  // Pour les autres sources, retourner l'URL originale
  return src;
}

/**
 * Génère le srcset pour différentes résolutions
 */
function generateSrcSet(
  src: string,
  widths: number[],
  quality: number = 80,
  format?: 'webp' | 'avif' | 'auto'
): string {
  return widths
    .map(width => {
      const url = getOptimizedImageUrl(src, width, quality, format);
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Vérifie le support WebP
 */
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Vérifie le support AVIF
 */
function supportsAVIF(): boolean {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
}

export const OptimizedImage = React.memo<OptimizedImageProps>(
  ({
    src,
    alt,
    width,
    height,
    sizes,
    quality = 80,
    showPlaceholder = true,
    showSkeleton = false,
    containerClassName,
    imageClassName,
    priority = false,
    format = 'auto',
    className,
    ...props
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority); // Si priority, charger immédiatement
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Largeurs pour srcset (responsive)
    const srcsetWidths = useMemo(() => {
      if (width) {
        // Générer des largeurs basées sur la largeur originale
        return [
          Math.round(width * 0.5),
          Math.round(width * 0.75),
          width,
          Math.round(width * 1.5),
          Math.round(width * 2),
        ].filter(w => w > 0);
      }
      // Largeurs par défaut pour responsive
      return [320, 640, 768, 1024, 1280, 1920];
    }, [width]);

    // URL optimisée de l'image
    const optimizedSrc = useMemo(
      () => getOptimizedImageUrl(src, width, quality, format),
      [src, width, quality, format]
    );

    // Srcset pour différentes résolutions
    const srcset = useMemo(
      () => generateSrcSet(src, srcsetWidths, quality, format),
      [src, srcsetWidths, quality, format]
    );

    // Sizes par défaut si non fourni
    const defaultSizes = useMemo(() => {
      if (sizes) return sizes;
      if (width) {
        return `(max-width: ${width}px) 100vw, ${width}px`;
      }
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
    }, [sizes, width]);

    // IntersectionObserver pour lazy loading
    useEffect(() => {
      if (priority || isInView) return;

      const img = imgRef.current;
      if (!img) return;

      observerRef.current = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observerRef.current?.disconnect();
            }
          });
        },
        {
          rootMargin: '50px', // Commencer à charger 50px avant d'entrer dans le viewport
        }
      );

      observerRef.current.observe(img);

      return () => {
        observerRef.current?.disconnect();
      };
    }, [priority, isInView]);

    // Gestion du chargement
    const handleLoad = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoaded(true); // Arrêter le skeleton même en cas d'erreur
    };

    // Styles du placeholder blur
    const placeholderStyle: React.CSSProperties = useMemo(() => {
      if (!showPlaceholder || isLoaded) return {};
      return {
        filter: 'blur(20px)',
        transition: 'filter 0.3s ease-out',
      };
    }, [showPlaceholder, isLoaded]);

    return (
      <div
        className={cn('relative overflow-hidden', containerClassName, className)}
        style={{ width, height }}
      >
        {/* Skeleton pendant le chargement */}
        {showSkeleton && !isLoaded && !hasError && (
          <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden="true" />
        )}

        {/* Placeholder blur */}
        {showPlaceholder && !isLoaded && !hasError && (
          <img
            src={optimizedSrc}
            alt=""
            className={cn('absolute inset-0 w-full h-full object-cover', imageClassName)}
            style={placeholderStyle}
            aria-hidden="true"
            loading="eager"
          />
        )}

        {/* Image principale */}
        {(isInView || priority) && (
          <img
            ref={imgRef}
            src={optimizedSrc}
            srcSet={srcsetWidths.length > 1 ? srcset : undefined}
            sizes={defaultSizes}
            alt={alt}
            width={width}
            height={height}
            className={cn(
              // ✅ iOS/scroll stability: never render the main image as opacity-0
              // (can look like it "disappears" during fast scroll). Placeholder/skeleton covers loading state.
              'w-full h-full object-cover',
              imageClassName
            )}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        )}

        {/* Erreur de chargement */}
        {hasError && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-muted"
            role="img"
            aria-label={alt}
          >
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Comparaison optimisée pour éviter les re-renders inutiles
    return (
      prevProps.src === nextProps.src &&
      prevProps.alt === nextProps.alt &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.priority === nextProps.priority
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';
