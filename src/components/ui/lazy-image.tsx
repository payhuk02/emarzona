/**
 * LazyImage - Composant d'image optimisé mobile-first
 * Lazy loading, formats WebP, ratios fixes, skeleton loading
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Source de l'image
   */
  src: string;
  /**
   * Source alternative (fallback)
   */
  fallbackSrc?: string;
  /**
   * Ratio d'aspect (ex: "16/9", "1/1", "4/3")
   */
  aspectRatio?: string;
  /**
   * Alt text (requis pour accessibilité)
   */
  alt: string;
  /**
   * Afficher un skeleton pendant le chargement
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
   */
  priority?: boolean;
}

/**
 * Composant d'image optimisé mobile-first
 */
export const LazyImage : React.FC<LazyImageProps> = ({
  src,
  fallbackSrc,
  aspectRatio,
  alt,
  showSkeleton = true,
  containerClassName,
  imageClassName,
  priority = false,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(priority ? src : undefined);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Lazy loading avec Intersection Observer
  useEffect(() => {
    if (priority || imageSrc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Commencer à charger 50px avant d'entrer dans le viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
    }
  };

  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : undefined;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        aspectRatio && 'aspect-[var(--aspect-ratio)]',
        containerClassName
      )}
      style={aspectRatio ? { '--aspect-ratio': aspectRatio } as React.CSSProperties : undefined}
    >
      {/* Skeleton pendant le chargement */}
      {showSkeleton && !isLoaded && !hasError && (
        <Skeleton 
          className={cn(
            'absolute inset-0 w-full h-full',
            aspectRatio && 'aspect-[var(--aspect-ratio)]'
          )}
          style={aspectRatioStyle}
        />
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={imageSrc || (priority ? src : undefined)}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          imageClassName,
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {/* Erreur de chargement */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">Image non disponible</span>
        </div>
      )}
    </div>
  );
};

/**
 * Image optimisée pour les cartes produits
 */
interface ProductImageProps extends Omit<LazyImageProps, 'aspectRatio'> {
  /**
   * Taille de l'image
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ProductImage : React.FC<ProductImageProps> = ({
  size = 'md',
  ...props
}) => {
  const sizeClasses = {
    sm: 'aspect-square max-w-[120px]',
    md: 'aspect-square max-w-[200px]',
    lg: 'aspect-square max-w-[300px]',
    xl: 'aspect-square max-w-full',
  };

  return (
    <LazyImage
      aspectRatio="1/1"
      containerClassName={sizeClasses[size]}
      showSkeleton
      {...props}
    />
  );
};








