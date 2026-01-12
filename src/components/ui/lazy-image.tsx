/**
 * Composant LazyImage optimisé avec chargement progressif
 * Utilise les dernières techniques d'optimisation d'images
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useImageOptimization, useImageFormatSupport } from '@/hooks/useImageOptimization';
import { logger } from '@/lib/logger';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  className?: string;
  containerClassName?: string;
  sizes?: string;
}

const LazyImage = React.memo<LazyImageProps>(
  ({
    src,
    alt,
    width,
    height,
    quality = 85,
    format,
    fit = 'cover',
    placeholder,
    blurDataURL,
    priority = false,
    onLoad,
    onError,
    className,
    containerClassName,
    sizes,
    ...props
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Support des formats modernes
    const { webp, avif, loading: formatLoading } = useImageFormatSupport();

    // Optimisation de l'image
    const optimizedImage = useImageOptimization(src, {
      quality,
      format: format || (avif ? 'avif' : webp ? 'webp' : 'jpg'),
      width,
      height,
      fit,
    });

    // Intersection Observer pour le lazy loading
    useEffect(() => {
      if (priority || isInView) return;

      const observer = new IntersectionObserver(
        entries => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '50px', // Commencer le chargement 50px avant que l'image soit visible
          threshold: 0.1,
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [priority, isInView]);

    // Gestionnaire de chargement réussi
    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    }, [onLoad]);

    // Gestionnaire d'erreur
    const handleError = useCallback(
      (error: Event) => {
        setHasError(true);
        setIsLoaded(false);
        logger.error('Image failed to load', { src, error });
        // Appeler onError si fourni (pour permettre le fallback)
        if (onError) {
          onError(error);
        }
      },
      [src, onError]
    );

    // Générer l'URL de placeholder
    const placeholderSrc =
      blurDataURL ||
      placeholder ||
      `data:image/svg+xml;base64,${btoa(`
    <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dy=".3em">
        Chargement...
      </text>
    </svg>
  `)}`;

    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden', containerClassName)}
        style={{ width, height }}
      >
        {/* Placeholder/Loading state */}
        {(!isLoaded || hasError) && (
          <img
            src={placeholderSrc}
            alt=""
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-0' : 'opacity-100'
            )}
            style={{ filter: blurDataURL ? 'blur(10px)' : 'none' }}
            aria-hidden="true"
          />
        )}

        {/* Skeleton loader */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        )}

        {/* Main image */}
        {isInView && !formatLoading && (
          <picture>
            {/* AVIF format (highest quality) */}
            {avif && (
              <source srcSet={src.replace(/\.(jpg|jpeg|png)$/, '.avif')} type="image/avif" />
            )}

            {/* WebP format */}
            {webp && (
              <source
                srcSet={optimizedImage.srcSet || optimizedImage.src}
                type="image/webp"
                sizes={sizes || optimizedImage.sizes}
              />
            )}

            {/* Fallback format */}
            <img
              ref={imgRef}
              src={optimizedImage.src || src}
              srcSet={optimizedImage.srcSet}
              sizes={sizes || optimizedImage.sizes}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className={cn(
                'w-full h-full transition-opacity duration-300',
                // Utiliser object-contain si spécifié dans className, sinon object-cover par défaut
                className?.includes('object-contain')
                  ? 'object-contain'
                  : className?.includes('object-cover')
                    ? 'object-cover'
                    : 'object-cover',
                isLoaded ? 'opacity-100' : 'opacity-0',
                className
              )}
              onLoad={handleLoad}
              onError={handleError}
              {...props}
            />
          </picture>
        )}

        {/* Error state - Seulement si onError n'est pas fourni (pour permettre le fallback externe) */}
        {hasError && !onError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-12 w-12 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-sm">Image indisponible</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

export { LazyImage };
export type { LazyImageProps };
