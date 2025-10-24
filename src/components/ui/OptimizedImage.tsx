/**
 * Composant Image Optimisé avec support des transformations Supabase
 * 
 * Features:
 * - Lazy loading automatique
 * - srcSet responsive
 * - Formats WebP
 * - Placeholder pendant chargement
 * - Gestion d'erreurs
 * - Support fallback pour images non-Supabase
 */

import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { 
  getImageAttributesForPreset, 
  IMAGE_PRESETS,
  isSupabaseStorageUrl 
} from '@/lib/image-transform';
import { Skeleton } from './skeleton';

export type ImagePreset = keyof typeof IMAGE_PRESETS;

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  /** URL de l'image source */
  src: string | undefined | null;
  
  /** Preset d'optimisation à utiliser */
  preset: ImagePreset;
  
  /** Texte alternatif (obligatoire pour accessibilité) */
  alt: string;
  
  /** Afficher un skeleton pendant le chargement */
  showSkeleton?: boolean;
  
  /** Composant fallback si image non chargée */
  fallback?: React.ReactNode;
  
  /** Classe CSS du container */
  containerClassName?: string;
  
  /** Priorité de chargement (disable lazy loading si true) */
  priority?: boolean;
  
  /** Callback quand l'image est chargée */
  onLoad?: () => void;
  
  /** Callback en cas d'erreur */
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  preset,
  alt,
  showSkeleton = true,
  fallback,
  containerClassName,
  priority = false,
  onLoad,
  onError,
  className,
  ...props
}: OptimizedImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageAttrs, setImageAttrs] = useState<{
    src?: string;
    srcSet?: string;
    sizes?: string;
  }>({});

  // Générer les attributs d'image optimisés
  useEffect(() => {
    if (src) {
      const attrs = getImageAttributesForPreset(src, preset);
      setImageAttrs(attrs);
    } else {
      setImageAttrs({});
    }
  }, [src, preset]);

  // Handler de chargement réussi
  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  // Handler d'erreur
  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  // Si pas de src, afficher le fallback
  if (!src || (!imageAttrs.src && isSupabaseStorageUrl(src))) {
    if (fallback) {
      return <div className={containerClassName}>{fallback}</div>;
    }
    return null;
  }

  // Si erreur de chargement, afficher le fallback
  if (error) {
    if (fallback) {
      return <div className={containerClassName}>{fallback}</div>;
    }
    return null;
  }

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {/* Skeleton pendant le chargement */}
      {loading && showSkeleton && (
        <Skeleton className="absolute inset-0 z-10" />
      )}

      {/* Image optimisée */}
      <img
        {...props}
        src={imageAttrs.src || src}
        srcSet={imageAttrs.srcSet}
        sizes={imageAttrs.sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          loading ? 'opacity-0' : 'opacity-100',
          className
        )}
      />
    </div>
  );
};

/**
 * Composant OptimizedImage spécialisé pour les images de produits
 * Wrapper de OptimizedImage avec des options précon figurées
 */
export const ProductImage = ({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'preset'>) => {
  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      preset="productImage"
      className={className}
      fallback={
        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      }
    />
  );
};

/**
 * Composant OptimizedImage spécialisé pour les logos de boutiques
 */
export const StoreLogoImage = ({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'preset'>) => {
  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      preset="storeLogo"
      className={cn('rounded-full object-cover', className)}
      fallback={
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {alt.charAt(0).toUpperCase()}
          </span>
        </div>
      }
    />
  );
};

/**
 * Composant OptimizedImage spécialisé pour les bannières de boutiques
 */
export const StoreBannerImage = ({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'preset'>) => {
  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      preset="storeBanner"
      className={cn('w-full object-cover', className)}
      fallback={
        <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
          <svg
            className="w-24 h-24 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      }
    />
  );
};

/**
 * Composant OptimizedImage spécialisé pour les avatars
 */
export const AvatarImage = ({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'preset'>) => {
  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      preset="avatar"
      className={cn('rounded-full object-cover', className)}
      fallback={
        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg font-bold">
            {alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
      }
    />
  );
};

/**
 * Composant OptimizedImage spécialisé pour les thumbnails
 */
export const ThumbnailImage = ({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'preset'>) => {
  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      preset="productThumbnail"
      className={className}
      fallback={
        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      }
    />
  );
};

