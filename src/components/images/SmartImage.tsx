/**
 * <SmartImage /> — composant universel d'affichage premium.
 *
 * Avantages :
 * - Lazy loading par défaut + decoding async
 * - Skeleton/blur placeholder pendant le chargement
 * - srcSet responsive automatique pour les images Supabase
 * - Fallback transparent en cas d'erreur
 * - Accessibilité: alt obligatoire (warning si manquant)
 */

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  buildTransformedUrl,
  buildSrcSet,
  type TransformOptions,
} from '@/lib/images/supabaseTransform';

export interface SmartImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'srcSet' | 'sizes'> {
  src: string | null | undefined;
  alt: string;
  /** Largeur cible d'affichage (sert au srcSet). */
  width?: number;
  /** Hauteur cible d'affichage. */
  height?: number;
  /** Sizes média query, ex: "(max-width: 768px) 100vw, 50vw". */
  sizes?: string;
  /** Qualité 1-100, par défaut 80. */
  quality?: number;
  /** Mode de redimensionnement Supabase. */
  resize?: TransformOptions['resize'];
  /** Largeurs candidates du srcSet. */
  srcSetWidths?: number[];
  /** Désactive le lazy loading (utile pour LCP/hero). */
  priority?: boolean;
  /** URL fallback en cas d'erreur. */
  fallbackSrc?: string;
  /** Classe appliquée au wrapper, l'image prend 100%. */
  wrapperClassName?: string;
  /** Effet pendant le loading: blur ou skeleton. */
  placeholder?: 'blur' | 'skeleton' | 'none';
}

const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1920];

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  quality = 80,
  resize = 'cover',
  srcSetWidths,
  priority = false,
  fallbackSrc,
  wrapperClassName,
  placeholder = 'skeleton',
  className,
  onLoad,
  onError,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const finalSrc = errored && fallbackSrc ? fallbackSrc : src ?? '';

  const optimizedSrc = useMemo(
    () =>
      buildTransformedUrl(finalSrc, {
        width,
        height,
        quality,
        resize,
      }),
    [finalSrc, width, height, quality, resize],
  );

  const srcSet = useMemo(() => {
    if (!finalSrc) return undefined;
    // Pour les data: / blob:, pas de srcset
    if (finalSrc.startsWith('data:') || finalSrc.startsWith('blob:')) return undefined;
    return buildSrcSet(finalSrc, srcSetWidths ?? DEFAULT_WIDTHS, {
      quality,
      resize,
    });
  }, [finalSrc, srcSetWidths, quality, resize]);

  if (!finalSrc) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground text-xs',
          wrapperClassName,
        )}
        style={{ width, height }}
        aria-label={alt}
      >
        Aucune image
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-muted', wrapperClassName)}>
      {!loaded && placeholder !== 'none' && (
        <div
          aria-hidden
          className={cn(
            'absolute inset-0',
            placeholder === 'skeleton' && 'animate-pulse bg-muted',
            placeholder === 'blur' && 'bg-muted/60 backdrop-blur-md',
          )}
        />
      )}
      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setErrored(true);
          onError?.(e);
        }}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        {...rest}
      />
    </div>
  );
};

export default SmartImage;
