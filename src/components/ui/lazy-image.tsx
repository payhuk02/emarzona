/**
 * Composant LazyImage optimisé pour le chargement des images
 * Utilise IntersectionObserver pour charger les images uniquement quand elles sont visibles
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string;
  alt: string;
  placeholder?: string;
  fallbackSrc?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  ({
    src,
    alt,
    placeholder,
    fallbackSrc,
    className,
    onLoad,
    onError,
    ...props
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Observer pour détecter quand l'image entre dans la viewport
    useEffect(() => {
      const element = imgRef.current;
      if (!element) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        },
        {
          rootMargin: '50px', // Commencer le chargement 50px avant que l'image soit visible
          threshold: 0.1,
        }
      );

      observerRef.current.observe(element);

      return () => {
        observerRef.current?.disconnect();
      };
    }, []);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    const currentSrc = hasError && fallbackSrc ? fallbackSrc : src;

    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* Placeholder pendant le chargement */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            {placeholder ? (
              <img
                src={placeholder}
                alt=""
                className="w-full h-full object-cover opacity-50"
                aria-hidden="true"
              />
            ) : (
              <div className="text-muted-foreground text-xs">Chargement...</div>
            )}
          </div>
        )}

        {/* Image réelle */}
        {isInView && (
          <img
            ref={ref || imgRef}
            src={currentSrc}
            alt={alt}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        )}

        {/* Skeleton loader */}
        {!isInView && (
          <div
            ref={imgRef}
            className="bg-muted animate-pulse"
            style={{
              width: props.width || '100%',
              height: props.height || '100%',
            }}
          />
        )}
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';
