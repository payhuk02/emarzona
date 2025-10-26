/**
 * Composant OptimizedImage avec support WebP et lazy loading
 * Affiche automatiquement la version WebP si disponible
 * 
 * Usage:
 * <OptimizedImage src="/image.jpg" alt="Description" width={400} height={300} />
 */

import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string;
  priority?: boolean; // Si true, ne pas lazy load
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  fallback = '/placeholder-image.png',
  priority = false,
  ...props
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Convertir l'URL en WebP si possible
  const getWebPUrl = (url: string): string => {
    if (!url || error) return fallback;
    
    // Si l'image est déjà en WebP, retourner tel quel
    if (url.endsWith('.webp')) return url;
    
    // Si c'est une URL Supabase Storage, on peut demander WebP via transformation
    if (url.includes('supabase.co/storage')) {
      // Supabase supporte les transformations d'images
      // Format: {url}?width={width}&quality=80&format=webp
      const separator = url.includes('?') ? '&' : '?';
      const params = new URLSearchParams();
      
      if (width) params.append('width', width.toString());
      params.append('quality', '80');
      params.append('format', 'webp');
      
      return `${url}${separator}${params.toString()}`;
    }
    
    // Sinon, retourner l'URL originale
    return url;
  };

  const webpSrc = getWebPUrl(src);
  const originalSrc = error ? fallback : src;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    console.error(`[OptimizedImage] Failed to load: ${src}`);
    setError(true);
    setIsLoading(false);
  };

  return (
    <picture className={cn('relative', className)}>
      {/* Source WebP */}
      {!error && webpSrc !== originalSrc && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      
      {/* Image fallback */}
      <img
        src={originalSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          className
        )}
        {...props}
      />
      
      {/* Skeleton loading */}
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse bg-muted rounded"
          style={{ width, height }}
        />
      )}
    </picture>
  );
};

/**
 * Version avec ratio aspect fixe
 */
interface OptimizedImageWithAspectRatioProps extends OptimizedImageProps {
  aspectRatio?: string; // ex: "16/9", "4/3", "1/1"
}

export const OptimizedImageWithAspectRatio = ({
  aspectRatio = '16/9',
  className,
  ...props
}: OptimizedImageWithAspectRatioProps) => {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        {...props}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};
