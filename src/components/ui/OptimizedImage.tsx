/**
 * Composant Image Optimisée pour le SEO et les performances
 * Génère automatiquement les attributs SEO et les tailles responsive
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useImageOptimization, useImagePerformanceMonitoring } from '@/hooks/useImageOptimization';
import { generateImageSEOAttributes } from '@/lib/image-optimization';
import { generateResponsiveSrcSet } from '@/lib/image-formats';
import { useAdaptiveLoading } from '@/hooks/useAdaptiveLoading';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt'
> {
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

  // Formats modernes
  enableModernFormats?: boolean; // Activer WebP/AVIF (défaut: true)
  formats?: ('avif' | 'webp' | 'jpg')[]; // Formats à utiliser (défaut: ['avif', 'webp', 'jpg'])
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 85,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw', // Optimisé pour mobile-first
  placeholder = 'empty',
  blurDataURL,
  className,
  onLoad,
  onError,
  seoScore = false,
  lazy = true,
  enableModernFormats = true,
  formats = ['avif', 'webp', 'jpg'],
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const { isLowBandwidth } = useAdaptiveLoading(); // Utiliser le hook de chargement adaptatif

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
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            recordMetric('lcp', entry.startTime);
          }
        });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }, [onLoad, priority, recordMetric]);

  const handleError = useCallback(
    (error: Event) => {
      setHasError(true);
      setCurrentSrc('/images/fallback-image.jpg'); // Image de fallback
      onError?.(error);
    },
    [onError]
  );

  // Générer les sources responsive (srcset) optimisé pour mobile-first
  const generateSrcSet = useCallback(
    (format?: string) => {
      if (!width) return undefined;

      // Breakpoints optimisés pour mobile-first (320px, 640px, 768px, 1024px, 1280px)
      const breakpoints = [320, 640, 768, 1024, 1280, 1600];
      const sources: string[] = [];

      breakpoints.forEach(bp => {
        if (width >= bp) {
          // Générer l'URL de l'image redimensionnée avec format
          const formatParam = format ? `&format=${format}` : '';
          const resizedSrc = `${src}?w=${bp}&q=${quality}${formatParam}`;
          sources.push(`${resizedSrc} ${bp}w`);
        }
      });

      return sources.length > 0 ? sources.join(', ') : undefined;
    },
    [src, width, quality]
  );

  // Générer les srcsets pour tous les formats si modern formats activé
  const modernSrcSets =
    enableModernFormats && width && !isLowBandwidth
      ? generateResponsiveSrcSet(src, [320, 640, 768, 1024, 1280, 1600], quality, isLowBandwidth)
      : null;

  // Fallback srcset classique
  const fallbackSrcSet = generateSrcSet();

  // Preload LCP image si priority est activé
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      // Preload la version AVIF si disponible, sinon WebP, sinon fallback
      const preloadSrc =
        enableModernFormats && modernSrcSets?.avif
          ? modernSrcSets.avif.split(',')[0].split(' ')[0] // Prendre la première source AVIF
          : src;
      link.href = preloadSrc;
      link.setAttribute('fetchpriority', 'high');
      const srcSetToUse =
        enableModernFormats && modernSrcSets?.avif ? modernSrcSets.avif : fallbackSrcSet;
      if (srcSetToUse) {
        link.setAttribute('imagesrcset', srcSetToUse);
        link.setAttribute('imagesizes', sizes);
      }
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [priority, src, fallbackSrcSet, modernSrcSets, sizes, enableModernFormats]);

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

      {/* Image optimisée avec support WebP/AVIF si activé */}
      {enableModernFormats && modernSrcSets ? (
        <picture>
          {/* AVIF - Meilleure compression */}
          {formats.includes('avif') && modernSrcSets.avif && (
            <source srcSet={modernSrcSets.avif} sizes={sizes} type="image/avif" />
          )}
          {/* WebP - Bon compromis */}
          {formats.includes('webp') && modernSrcSets.webp && (
            <source srcSet={modernSrcSets.webp} sizes={sizes} type="image/webp" />
          )}
          {/* Fallback JPG */}
          <img
            {...props}
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            loading={lazy && !priority ? 'lazy' : 'eager'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            srcSet={modernSrcSets.fallback}
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
            {...seoAttributes}
            itemProp={props.itemProp || 'image'}
            data-seo-optimized="true"
            data-original-src={src}
            data-quality={quality}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              hasError && 'opacity-50',
              seoAttributes.className
            )}
            data-lcp-candidate={priority ? 'true' : undefined}
            data-image-loaded={isLoaded ? 'true' : 'false'}
            data-image-error={hasError ? 'true' : undefined}
          />
        </picture>
      ) : (
        /* Image classique sans formats modernes */
        <img
          {...props}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          srcSet={fallbackSrcSet}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          {...seoAttributes}
          itemProp={props.itemProp || 'image'}
          data-seo-optimized="true"
          data-original-src={src}
          data-quality={quality}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            hasError && 'opacity-50',
            seoAttributes.className
          )}
          data-lcp-candidate={priority ? 'true' : undefined}
          data-image-loaded={isLoaded ? 'true' : 'false'}
          data-image-error={hasError ? 'true' : undefined}
        />
      )}

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
            <span className="text-red-400 ml-1">({seoAttributes['data-seo-issues']} issues)</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Hook optimisé pour précharger des images critiques (LCP)
 * Utilise <link rel="preload"> pour une meilleure performance
 */
export function useImagePreloader(srcs: string[]) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    srcs.forEach(src => {
      // Utiliser preload link pour une meilleure performance que Image()
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
      links.push(link);
    });

    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [srcs]);
}

/**
 * Hook spécialisé pour preload LCP images
 * Optimisé pour améliorer le Largest Contentful Paint
 */
export function useLCPImagePreload(src: string, srcSet?: string, sizes?: string) {
  useEffect(() => {
    if (!src) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.setAttribute('fetchpriority', 'high');

    if (srcSet) {
      link.setAttribute('imagesrcset', srcSet);
    }

    if (sizes) {
      link.setAttribute('imagesizes', sizes);
    }

    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [src, srcSet, sizes]);
}

// Composant pour les images hero (LCP critique)
export const HeroImage: React.FC<Omit<OptimizedImageProps, 'priority'>> = props => (
  <OptimizedImage {...props} priority={true} lazy={false} />
);

// Composant pour les images de produit
export const ProductImage: React.FC<Omit<OptimizedImageProps, 'sizes'>> = props => (
  <OptimizedImage
    {...props}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    quality={90}
  />
);

// Composant pour les avatars
export const AvatarImage: React.FC<
  Omit<OptimizedImageProps, 'sizes' | 'width' | 'height'>
> = props => (
  <OptimizedImage {...props} width={40} height={40} sizes="40px" quality={80} placeholder="empty" />
);

export default OptimizedImage;
