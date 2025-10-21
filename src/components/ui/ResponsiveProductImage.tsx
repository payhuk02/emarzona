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
}

export const ResponsiveProductImage = ({
  src,
  alt,
  className,
  fallbackIcon,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  placeholder = 'empty',
  blurDataURL
}: ResponsiveProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // Optimisation de l'URL d'image pour WebP et compression
  const getOptimizedImageUrl = (originalSrc: string) => {
    // Si c'est déjà une URL optimisée ou externe, retourner tel quel
    if (originalSrc.includes('?') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // Pour les images Supabase Storage, ajouter les paramètres d'optimisation
    const params = new URLSearchParams({
      format: 'webp',
      quality: quality.toString(),
      resize: 'cover'
    });

    return `${originalSrc}?${params.toString()}`;
  };

  if (!src || hasError) {
    return (
      <div 
        ref={imgRef}
        className={cn(
          "w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800",
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
    <div ref={imgRef} className={cn("relative w-full h-full", className)}>
      {/* Placeholder de chargement */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 animate-pulse">
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-8 w-8 text-slate-400 animate-spin">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Image optimisée */}
      {isInView && (
        <img
          src={getOptimizedImageUrl(src)}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes={sizes}
          style={{
            // Prévenir le CLS (Cumulative Layout Shift)
            aspectRatio: '16/9'
          }}
        />
      )}
    </div>
  );
};

// Hook pour l'optimisation d'images
export const useImageOptimization = () => {
  const [isWebPSupported, setIsWebPSupported] = useState(false);

  useEffect(() => {
    // Vérifier le support WebP
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const dataURL = canvas.toDataURL('image/webp');
      setIsWebPSupported(dataURL.indexOf('data:image/webp') === 0);
    }
  }, []);

  const getOptimizedImageUrl = (src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}) => {
    const { width, height, quality = 85, format = 'webp' } = options;
    
    // Si c'est une URL externe, retourner tel quel
    if (src.startsWith('http') && !src.includes('supabase')) {
      return src;
    }

    const params = new URLSearchParams();
    
    if (format && isWebPSupported) {
      params.set('format', format);
    }
    
    if (quality) {
      params.set('quality', quality.toString());
    }
    
    if (width) {
      params.set('width', width.toString());
    }
    
    if (height) {
      params.set('height', height.toString());
    }
    
    params.set('resize', 'cover');

    return `${src}?${params.toString()}`;
  };

  return {
    isWebPSupported,
    getOptimizedImageUrl
  };
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
}

export const ProductBanner = ({
  src,
  alt,
  className,
  fallbackIcon,
  priority = false,
  overlay,
  badges
}: ProductBannerProps) => {
  return (
    <div className={cn("relative w-full", className)}>
      {/* Container avec ratio 16:9 */}
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg">
        <ResponsiveProductImage
          src={src}
          alt={alt}
          fallbackIcon={fallbackIcon}
          priority={priority}
          className="w-full h-full"
        />
        
        {/* Overlay gradient */}
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            {overlay}
          </div>
        )}
        
        {/* Badges */}
        {badges && (
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {badges}
          </div>
        )}
      </div>
    </div>
  );
};
