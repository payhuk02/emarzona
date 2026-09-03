/**
 * LazyImage Component avec Intersection Observer et Placeholders Avancés
 * Date: 28 Janvier 2025
 *
 * Composant d'image avec lazy loading intelligent, placeholders sophistiqués,
 * et support pour LQIP (Low Quality Image Placeholder)
 */

import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, isSupabaseStorageUrl } from '@/lib/image-transform';
import { logger } from '@/lib/logger';

/**
 * Types de placeholders disponibles
 */
export type PlaceholderType =
  | 'skeleton' // Skeleton animé (défaut)
  | 'blur' // Blur effect (nécessite blurDataURL)
  | 'gradient' // Gradient animé
  | 'pulse' // Pulse effect
  | 'shimmer' // Shimmer effect
  | 'none'; // Pas de placeholder

/**
 * Props pour LazyImage
 */
export interface LazyImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'loading'
> {
  /**
   * URL de l'image
   */
  src: string;

  /**
   * Texte alternatif (requis pour accessibilité)
   */
  alt: string;

  /**
   * Type de placeholder (défaut: 'skeleton')
   */
  placeholder?: PlaceholderType;

  /**
   * URL de l'image blur (pour placeholder type 'blur')
   * Généralement une version très compressée de l'image
   */
  blurDataURL?: string;

  /**
   * Largeur de l'image (pour aspect ratio)
   */
  width?: number;

  /**
   * Hauteur de l'image (pour aspect ratio)
   */
  height?: number;

  /**
   * Ratio d'aspect (ex: '16/9', '1/1', '4/3')
   */
  aspectRatio?: string;

  /**
   * Charger immédiatement (pas de lazy loading)
   */
  priority?: boolean;

  /**
   * Image de fallback en cas d'erreur
   */
  fallback?: string;

  /**
   * Classe CSS personnalisée
   */
  className?: string;

  /**
   * Root margin pour Intersection Observer (défaut: '50px')
   * Augmente la zone de détection pour précharger avant l'affichage
   */
  rootMargin?: string;

  /**
   * Threshold pour Intersection Observer (défaut: 0.1)
   * Pourcentage de visibilité requis pour déclencher le chargement
   */
  threshold?: number;

  /**
   * Qualité de l'image (1-100, défaut: 85)
   */
  quality?: number;

  /**
   * Format de l'image ('webp', 'jpg', 'png', 'auto')
   */
  format?: 'webp' | 'jpg' | 'png' | 'auto';

  /**
   * Callback appelé quand l'image est chargée
   */
  onLoadComplete?: () => void;

  /**
   * Callback appelé en cas d'erreur
   */
  onLoadError?: (error: Error) => void;
}

/**
 * Composant LazyImage avec lazy loading intelligent
 */
export function LazyImage({
  src,
  alt,
  placeholder = 'skeleton',
  blurDataURL,
  width,
  height,
  aspectRatio,
  priority = false,
  fallback = '/placeholder.svg',
  className,
  rootMargin = '50px',
  threshold = 0.1,
  quality = 90, // Qualité élevée pour netteté professionnelle
  format = 'auto',
  onLoadComplete,
  onLoadError,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // priority => eager, sinon lazy via IntersectionObserver
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour détecter quand l'image entre dans le viewport
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [priority, isInView, rootMargin, threshold]);

  // Générer l'URL optimisée de l'image
  useEffect(() => {
    if (!isInView || hasError) return;

    if (isSupabaseStorageUrl(src)) {
      const optimizedUrl = getOptimizedImageUrl(src, {
        width,
        quality,
        format: format === 'auto' ? 'webp' : format,
      });
      setImageSrc(optimizedUrl || src);
    } else {
      setImageSrc(src);
    }
  }, [src, isInView, hasError, width, quality, format]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    logger.error('[LazyImage] Failed to load', { src });
    setHasError(true);
    setIsLoaded(false);

    const error = new Error(`Failed to load image: ${src}`);
    onLoadError?.(error);
  };

  // Styles pour le container
  const containerStyle: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : undefined,
    aspectRatio: aspectRatio,
  };

  // Note: les placeholders avancés existent (skeleton/blur/etc.), mais le rendu
  // principal privilégie un chargement léger + une transition d'opacité.

  const renderPlaceholderSkeleton = () => (
    <div
      className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-slate-400 dark:text-slate-600 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={containerStyle}
    >
      {/* Placeholder léger (améliore le ressenti sur mobile) */}
      {placeholder !== 'none' && !isLoaded && !hasError && renderPlaceholderSkeleton()}

      {/* Image réelle */}
      {isInView && imageSrc && (
        <img
          ref={imgRef}
          src={hasError ? fallback : imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-200 ease-in',
            'image-sharp', // Netteté professionnelle
            isLoaded ? 'opacity-100' : 'opacity-0',
            'w-full h-full object-cover'
          )}
          style={{
            imageRendering: 'crisp-edges',
            ...props.style,
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      )}

      {/* Pas d'overlay de chargement - afficher l'image directement */}
    </div>
  );
}

/**
 * Hook pour générer un blurDataURL à partir d'une image
 * Utile pour créer des placeholders blur
 */
export function useBlurDataURL(imageUrl: string): string | undefined {
  const [blurDataURL, setBlurDataURL] = useState<string | undefined>();

  useEffect(() => {
    if (!imageUrl || !isSupabaseStorageUrl(imageUrl)) return;

    // Générer une version très compressée pour le blur
    const blurUrl = getOptimizedImageUrl(imageUrl, {
      width: 20,
      quality: 20,
      format: 'jpg',
    });

    if (blurUrl) {
      // Charger l'image et la convertir en base64
      fetch(blurUrl)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setBlurDataURL(reader.result as string);
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          logger.warn('[LazyImage] Failed to generate blur data URL', { error });
        });
    }
  }, [imageUrl]);

  return blurDataURL;
}

/**
 * Version avec blur placeholder automatique
 */
export function LazyImageWithBlur(props: LazyImageProps) {
  const blurDataURL = useBlurDataURL(props.src);

  return (
    <LazyImage
      {...props}
      placeholder={
        props.placeholder === 'none'
          ? 'none'
          : blurDataURL
            ? 'blur'
            : props.placeholder || 'skeleton'
      }
      blurDataURL={blurDataURL}
    />
  );
}
