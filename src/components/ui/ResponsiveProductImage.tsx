import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useImageOptimization, useLazyLoading } from '@/hooks/useImageOptimization';

interface ResponsiveProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  context?: 'grid' | 'detail' | 'thumbnail';
}

export const ResponsiveProductImage = ({
  src,
  alt,
  className,
  fallbackIcon,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1920px) 33vw, 25vw',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  context = 'grid'
}: ResponsiveProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Utilisation des hooks d'optimisation
  const { getOptimizedImageUrl, getOptimalDimensions, createBlurPlaceholder } = useImageOptimization();
  const { isInView, hasLoaded, elementRef, markAsLoaded } = useLazyLoading(priority);

  const handleLoad = () => {
    setIsLoaded(true);
    markAsLoaded();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // Obtenir les dimensions optimales selon le contexte
  const optimalDimensions = getOptimalDimensions(context);
  
  // Créer un placeholder blur si nécessaire
  const blurPlaceholder = placeholder === 'blur' && !blurDataURL 
    ? createBlurPlaceholder(optimalDimensions.width, optimalDimensions.height)
    : blurDataURL;

  if (!src || hasError) {
    return (
      <div 
        ref={elementRef}
        className={cn(
          "w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800",
          className
        )}
      >
        {fallbackIcon || (
          <div className="h-12 w-12 text-slate-400">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={elementRef} 
      className={cn("relative w-full h-full", className)}
      role="img"
      aria-label={alt}
    >
      {/* Placeholder de chargement avec blur */}
      {!isLoaded && blurPlaceholder && (
        <img
          src={blurPlaceholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Placeholder de chargement animé */}
      {!isLoaded && !blurPlaceholder && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse"
          role="status"
          aria-label="Chargement de l'image"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-8 w-8 text-slate-400 animate-spin" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Image optimisée avec rendu professionnel */}
      {isInView && (
        <img
          src={getOptimizedImageUrl(src, {
            ...optimalDimensions,
            context,
            quality
          })}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-all duration-700 ease-out",
            "transform-gpu will-change-transform",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes={sizes}
          style={{
            // Prévenir le CLS (Cumulative Layout Shift)
            aspectRatio: '16/9',
            // Optimisation GPU pour les performances
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            // Qualité d'affichage optimisée
            imageRendering: 'high-quality'
          }}
        />
      )}
    </div>
  );
};

// Composant pour les bannières produits avec ratio 16:9
interface ProductBannerProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  overlay?: React.ReactNode;
  badges?: React.ReactNode;
  context?: 'grid' | 'detail' | 'thumbnail';
}

export const ProductBanner = ({
  src,
  alt,
  className,
  fallbackIcon,
  priority = false,
  overlay,
  badges,
  context = 'grid'
}: ProductBannerProps) => {
  return (
    <div className={cn("relative w-full product-banner-container", className)}>
      {/* Container avec ratio 16:9 optimisé pour tous les écrans */}
      <div className="relative w-full aspect-[16/9] overflow-hidden 
                      rounded-lg sm:rounded-xl lg:rounded-2xl
                      shadow-sm hover:shadow-lg transition-shadow duration-300">
        <ResponsiveProductImage
          src={src}
          alt={alt}
          fallbackIcon={fallbackIcon}
          priority={priority}
          className="w-full h-full"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1920px) 33vw, 25vw"
          context={context}
        />
        
        {/* Overlay gradient professionnel */}
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {overlay}
          </div>
        )}
        
        {/* Badges positionnés de manière professionnelle */}
        {badges && (
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {badges}
          </div>
        )}
        
        {/* Effet hover subtil */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
      </div>
    </div>
  );
};
