/**
 * Composant Image Optimisée pour le SEO et les performances
 * Génère automatiquement les attributs SEO et les tailles responsive
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useImageOptimization, useImagePerformanceMonitoring } from '@/hooks/useImageOptimization';
import { generateImageSEOAttributes } from '@/lib/image-optimization';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // Pour LCP
  quality?: number;
  sizes?: string; // Pour responsive images
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;

  // SEO spécifique
  seoScore?: boolean; // Afficher le score SEO dans les dev tools
  lazy?: boolean; // Lazy loading
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 85,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'empty',
  blurDataURL,
  className,
  onLoad,
  onError,
  seoScore = false,
  lazy = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const { recordMetric } = useImagePerformanceMonitoring();

  // Générer les attributs SEO
  const seoAttributes = generateImageSEOAttributes(
    src.split('/').pop() || 'image',
    alt,
    width,
    height,
    lazy ? 'lazy' : 'eager'
  );

  // Gérer le chargement de l'image
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();

    // Enregistrer les métriques de performance
    if (priority) {
      // Mesurer LCP pour les images prioritaires
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            recordMetric('lcp', entry.startTime);
          }
        });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }, [onLoad, priority, recordMetric]);

  const handleError = useCallback((error: Event) => {
    setHasError(true);
    setCurrentSrc('/images/fallback-image.jpg'); // Image de fallback
    onError?.(error);
  }, [onError]);

  // Générer les sources responsive (srcset)
  const generateSrcSet = useCallback(() => {
    if (!width) return undefined;

    const breakpoints = [400, 800, 1200, 1600];
    const sources: string[] = [];

    breakpoints.forEach(bp => {
      if (width >= bp) {
        // Générer l'URL de l'image redimensionnée
        // Dans un vrai système, ceci pointerait vers des images pré-générées
        const resizedSrc = `${src}?w=${bp}&q=${quality}`;
        sources.push(`${resizedSrc} ${bp}w`);
      }
    });

    return sources.length > 0 ? sources.join(', ') : undefined;
  }, [src, width, quality]);

  const srcSet = generateSrcSet();

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder pendant le chargement */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}

      {/* Image optimisée */}
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        srcSet={srcSet}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}

        // Attributs SEO générés automatiquement
        {...seoAttributes}

        // Attributs supplémentaires pour le SEO
        itemProp={props.itemProp || "image"}
        data-seo-optimized="true"
        data-original-src={src}
        data-quality={quality}

        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'opacity-50',
          seoAttributes.className
        )}

        // Attributs pour les métriques de performance
        data-lcp-candidate={priority ? 'true' : undefined}
        data-image-loaded={isLoaded ? 'true' : 'false'}
        data-image-error={hasError ? 'true' : undefined}
      />

      {/* Indicateur de chargement */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Indicateur d'erreur */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Image non disponible</div>
          </div>
        </div>
      )}

      {/* Badge SEO (uniquement en développement) */}
      {seoScore && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
          SEO: {seoAttributes['data-seo-score']}
          {seoAttributes['data-seo-issues'] > 0 && (
            <span className="text-red-400 ml-1">
              ({seoAttributes['data-seo-issues']} issues)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Hook pour précharger des images critiques
export function useImagePreloader(srcs: string[]) {
  useEffect(() => {
    srcs.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [srcs]);
}

// Composant pour les images hero (LCP critique)
export const HeroImage: React.FC<Omit<OptimizedImageProps, 'priority'>> = (props) => (
  <OptimizedImage {...props} priority={true} lazy={false} />
);

// Composant pour les images de produit
export const ProductImage: React.FC<Omit<OptimizedImageProps, 'sizes'>> = (props) => (
  <OptimizedImage
    {...props}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    quality={90}
  />
);

// Composant pour les avatars
export const AvatarImage: React.FC<Omit<OptimizedImageProps, 'sizes' | 'width' | 'height'>> = (props) => (
  <OptimizedImage
    {...props}
    width={40}
    height={40}
    sizes="40px"
    quality={80}
    placeholder="empty"
  />
);

export default OptimizedImage;