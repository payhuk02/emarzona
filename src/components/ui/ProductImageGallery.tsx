import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  priority?: boolean;
  showThumbnails?: boolean;
  showZoom?: boolean;
}

export const ProductImageGallery = ({
  images,
  alt,
  className,
  priority = false,
  showThumbnails = true,
  showZoom = true
}: ProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
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
        rootMargin: '100px',
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
    setIsLoaded(false);
  };

  // Optimisation de l'URL d'image pour les pages de détail
  const getOptimizedImageUrl = (originalSrc: string, isThumbnail = false) => {
    if (originalSrc.includes('?') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    const params = new URLSearchParams({
      format: 'webp',
      quality: '90', // Qualité élevée pour les pages de détail
      resize: 'cover'
    });

    if (isThumbnail) {
      params.set('width', '150');
      params.set('height', '150');
    } else {
      // Pour les images principales, optimiser pour le ratio 16:9 (1280x720)
      params.set('width', '1280');
      params.set('height', '720');
    }

    return `${originalSrc}?${params.toString()}`;
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className={cn("w-full aspect-[16/9] bg-muted rounded-lg flex items-center justify-center", className)}>
        <div className="text-muted-foreground text-center">
          <div className="h-16 w-16 mx-auto mb-4 opacity-30">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <p className="text-sm">Aucune image disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Image principale avec ratio 16:9 */}
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        <div ref={imgRef} className="relative w-full h-full">
          {/* Placeholder de chargement */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse">
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
              src={getOptimizedImageUrl(images[currentIndex])}
              alt={`${alt} - Image ${currentIndex + 1}`}
              className={cn(
                "w-full h-full object-cover transition-all duration-700 ease-out",
                "transform-gpu will-change-transform",
                isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
              )}
              onLoad={handleLoad}
              onError={handleError}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              style={{
                aspectRatio: '16/9',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                imageRendering: 'high-quality'
              }}
            />
          )}

          {/* Navigation pour plusieurs images */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border-slate-200 hover:bg-white shadow-lg h-10 w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border-slate-200 hover:bg-white shadow-lg h-10 w-10 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Indicateur d'images multiples */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Bouton zoom */}
          {showZoom && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsZoomed(true)}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border-slate-200 hover:bg-white shadow-lg h-10 w-10 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Miniatures */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200",
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <img
                src={getOptimizedImageUrl(image, true)}
                alt={`${alt} - Miniature ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal zoom */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full">
            <img
              src={getOptimizedImageUrl(images[currentIndex])}
              alt={`${alt} - Zoom`}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border-slate-200 hover:bg-white shadow-lg h-10 w-10 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
