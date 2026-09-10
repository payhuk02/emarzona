import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getScrollParent } from '@/hooks/useScrollAnimation';
import {
  buildProductImageUrl,
  buildProductSrcSet,
  getProductImageDimensions,
  type ProductImageContext,
} from '@/lib/images/supabaseTransform';

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
  context?: ProductImageContext;
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
  width?: number;
  height?: number;
}

export const ResponsiveProductImage = ({
  src,
  alt,
  className,
  fallbackIcon,
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  quality = 82,
  placeholder: _placeholder = 'empty',
  blurDataURL: _blurDataURL,
  context = 'grid',
  fit = 'cover',
  fill = true,
  width: propWidth,
  height: propHeight,
}: ResponsiveProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const elementRef = useRef<HTMLDivElement>(null);

  const dims = useMemo(
    () => getProductImageDimensions(context, propWidth, propHeight),
    [context, propWidth, propHeight]
  );

  const optimizedSrc = useMemo(() => {
    if (!src) return undefined;
    if (useOriginal) return src;
    return buildProductImageUrl(src, context, {
      width: dims.width,
      height: dims.height,
      quality,
      resize: fit === 'contain' ? 'contain' : 'cover',
    });
  }, [src, context, dims.width, dims.height, quality, fit, useOriginal]);

  const srcSet = useMemo(() => {
    if (!src || useOriginal) return undefined;
    const set = buildProductSrcSet(src, context, {
      quality,
      resize: fit === 'contain' ? 'contain' : 'cover',
    });
    return set || undefined;
  }, [src, context, quality, fit, useOriginal]);

  useEffect(() => {
    setHasError(false);
    setUseOriginal(false);
    setIsLoaded(false);
  }, [src]);

  useEffect(() => {
    if (priority || !elementRef.current) return;

    const node = elementRef.current;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const markInView = () => {
      setIsInView(true);
    };

    const fallbackTimer = setTimeout(markInView, isMobile ? 1500 : 2500);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            clearTimeout(fallbackTimer);
            markInView();
            observer.disconnect();
          }
        });
      },
      {
        root: getScrollParent(node),
        rootMargin: isMobile ? '240px 0px' : '120px 0px',
        threshold: 0,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (elementRef.current) {
      const img = elementRef.current.querySelector('img');
      img?.classList.add('loaded');
    }
  };

  const handleError = () => {
    // /render/image peut échouer → retenter l'URL object/public originale une fois
    if (src && !useOriginal && optimizedSrc && optimizedSrc !== src) {
      setUseOriginal(true);
      setIsLoaded(false);
      return;
    }
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

      {isInView && (
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          alt={alt}
          width={dims.width}
          height={dims.height}
          className={cn('w-full h-full', 'product-image', isLoaded ? 'opacity-100' : 'opacity-100')}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          data-no-mobile-opt=""
          sizes={sizes}
          style={{
            width: '100%',
            height: fill ? '100%' : 'auto',
            display: 'block',
            objectFit: fit,
            objectPosition: 'center',
            imageRendering: 'auto',
            borderRadius: 'inherit',
            transform: 'none',
            visibility: 'visible',
            opacity: 1,
            willChange: 'auto',
            backfaceVisibility: 'visible',
            WebkitBackfaceVisibility: 'visible',
            position: 'relative',
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
};

interface ProductBannerProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  overlay?: React.ReactNode;
  badges?: React.ReactNode;
  context?: ProductImageContext;
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

        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {overlay}
          </div>
        )}

        {badges && <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">{badges}</div>}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
      </div>
    </div>
  );
};
