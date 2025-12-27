import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  /**
   * How the image should fit inside its container.
   * - cover: stable cards/grids (cropping allowed)
   * - contain: detail views (no cropping, may letterbox)
   * @default 'cover'
   */
  fit?: 'cover' | 'contain';
  /**
   * If true, forces the image to fill the container height (h-full).
   * If false, image uses height:auto (fills width without cropping).
   * @default true
   */
  fill?: boolean;
  /**
   * Width of the image for optimization (overrides context-based defaults)
   */
  width?: number;
  /**
   * Height of the image for optimization (overrides context-based defaults)
   */
  height?: number;
}

export const ResponsiveProductImage = ({
  src,
  alt,
  className,
  fallbackIcon,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1920px) 33vw, 25vw',
  quality: quality = 85,
  placeholder: placeholder = 'empty',
  blurDataURL: _blurDataURL,
  context = 'grid',
  fit = 'cover',
  fill = true,
  width: propWidth,
  height: propHeight,
}: ResponsiveProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Si priority, charger immédiatement
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    if (priority || !elementRef.current) return;

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
        rootMargin: '50px',
      }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  if (!src || hasError) {
    return (
      <div
        ref={elementRef}
        className={cn(
          'w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800',
          className
        )}
      >
        {fallbackIcon || (
          <div className="h-12 w-12 text-slate-400">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className={cn('relative w-full', fill ? 'h-full' : 'h-auto', className)}
      role="img"
      aria-label={alt}
    >
      {/* Placeholder de chargement animé */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse"
          role="status"
          aria-label="Chargement de l'image"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-8 w-8 text-slate-400 animate-spin" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Image optimisée avec rendu professionnel - Stable et optimisée */}
      {isInView && (
        <img
          src={
            src
              ? (() => {
                  // ✅ OPTIMISATION: Utiliser WebP/AVIF pour Supabase Storage
                  if (src.includes('supabase.co/storage')) {
                    const params = new URLSearchParams();
                    // Utiliser les props width/height si fournies, sinon utiliser les valeurs par défaut basées sur le contexte
                    const width =
                      propWidth ??
                      (context === 'thumbnail' ? 768 : context === 'detail' ? 1536 : 1536);
                    const height =
                      propHeight ??
                      (context === 'thumbnail' ? 512 : context === 'detail' ? 1024 : 1024);
                    params.set('width', width.toString());
                    params.set('height', height.toString());
                    params.set('quality', '85');

                    // Détecter le meilleur format supporté
                    if (typeof document !== 'undefined') {
                      try {
                        const canvas = document.createElement('canvas');
                        canvas.width = 1;
                        canvas.height = 1;
                        if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
                          params.set('format', 'avif');
                        } else if (
                          canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
                        ) {
                          params.set('format', 'webp');
                        }
                      } catch {
                        // Fallback vers format original
                      }
                    }

                    return `${src}?${params.toString()}`;
                  }
                  return src;
                })()
              : undefined
          }
          alt={alt}
          width={
            propWidth ??
            (context === 'thumbnail'
              ? 768 // 3:2 thumbnail aligné avec IMAGE_FORMATS.thumbnail
              : context === 'detail'
                ? 1536 // format produit principal
                : 1536) // Format 1536x1024 pour les grilles (cartes produits) - ratio 3:2
          }
          height={
            propHeight ?? (context === 'thumbnail' ? 512 : context === 'detail' ? 1024 : 1024)
          }
          className={cn('w-full h-full', 'product-image', isLoaded ? 'opacity-100' : 'opacity-100')}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          sizes={sizes}
          style={{
            // Prévenir le CLS (Cumulative Layout Shift)
            // aspectRatio retiré car géré par le conteneur parent
            // ✅ Stabilité mobile: forcer l'image à remplir son conteneur (évite le height:auto de CSS externes)
            width: '100%',
            height: fill ? '100%' : 'auto',
            display: 'block',
            // Fit contrôlé (cover par défaut pour les cartes)
            objectFit: fit,
            objectPosition: 'center',
            // Qualité d'affichage optimisée
            imageRendering: 'high-quality',
            // Coins arrondis hérités du parent
            borderRadius: 'inherit',
            // Stabilité garantie - pas de transformations
            transform: 'none',
            // Toujours visible
            visibility: 'visible',
            opacity: 1,
            // Optimisation performance
            willChange: 'auto',
            backfaceVisibility: 'visible',
            WebkitBackfaceVisibility: 'visible',
            // Position relative pour garantir la visibilité
            position: 'relative',
            zIndex: 1,
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
  context = 'grid',
}: ProductBannerProps) => {
  return (
    <div className={cn('relative w-full product-banner-container', className)}>
      {/* Container avec ratio 3:2 (1536×1024) optimisé pour tous les écrans */}
      <div
        className="relative w-full aspect-[3/2] overflow-hidden 
                      rounded-lg sm:rounded-xl lg:rounded-2xl
                      shadow-sm hover:shadow-lg transition-shadow duration-300
                      bg-muted/30 flex items-center justify-center"
      >
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
        {badges && <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">{badges}</div>}

        {/* Effet hover subtil */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
      </div>
    </div>
  );
};






