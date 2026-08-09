import { useMemo } from 'react';
import { useLCPImagePreload } from '@/components/ui/OptimizedImage';
import { getPlatformHeroImageProps } from '@/lib/image-transform';

interface PremiumPlatformHeroBackgroundProps {
  src: string;
  alt: string;
  /** `visual` = colonne droite (LCP) ; `left` = arrière-plan colonne gauche */
  variant?: 'visual' | 'left';
}

export function PremiumPlatformHeroBackground({
  src,
  alt,
  variant = 'visual',
}: PremiumPlatformHeroBackgroundProps) {
  const imageProps = useMemo(() => getPlatformHeroImageProps(src, variant), [src, variant]);
  const isLcp = variant === 'visual';

  const preloadSrc = imageProps?.webpSrcSet?.split(',')[0]?.split(' ')[0] ?? imageProps?.src ?? src;
  useLCPImagePreload(
    isLcp ? preloadSrc : '',
    isLcp ? (imageProps?.webpSrcSet ?? imageProps?.srcSet) : undefined,
    isLcp ? imageProps?.sizes : undefined
  );

  if (!imageProps) return null;

  const photoClass =
    variant === 'left' ? 'lp-platform-hero__left-photo' : 'lp-platform-hero__photo';
  const imgClassName = `${photoClass} pointer-events-none absolute inset-0 h-full w-full object-cover`;

  if (imageProps.webpSrcSet || imageProps.avifSrcSet) {
    return (
      <picture className="pointer-events-none absolute inset-0 block h-full w-full">
        {imageProps.avifSrcSet ? (
          <source srcSet={imageProps.avifSrcSet} sizes={imageProps.sizes} type="image/avif" />
        ) : null}
        {imageProps.webpSrcSet ? (
          <source srcSet={imageProps.webpSrcSet} sizes={imageProps.sizes} type="image/webp" />
        ) : null}
        <img
          src={imageProps.src}
          srcSet={imageProps.srcSet}
          sizes={imageProps.sizes}
          alt={alt}
          className={imgClassName}
          loading={isLcp ? 'eager' : 'lazy'}
          fetchPriority={isLcp ? 'high' : 'auto'}
          decoding="async"
        />
      </picture>
    );
  }

  return (
    <img
      src={imageProps.src}
      srcSet={imageProps.srcSet}
      sizes={imageProps.sizes}
      alt={alt}
      className={imgClassName}
      loading={isLcp ? 'eager' : 'lazy'}
      fetchPriority={isLcp ? 'high' : 'auto'}
      decoding="async"
    />
  );
}
