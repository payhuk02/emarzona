import { useMemo, useState } from 'react';
import { useLCPImagePreload } from '@/components/ui/OptimizedImage';
import { getPlatformHeroImageProps } from '@/lib/image-transform';
import { toObjectPublicUrl } from '@/lib/images/supabaseTransform';

interface PremiumPlatformHeroBackgroundProps {
  src: string;
  alt: string;
  /** `visual` = photo LCP plein hero ; `left` = carte mondiale en arrière-plan */
  variant?: 'visual' | 'left';
}

export function PremiumPlatformHeroBackground({
  src,
  alt,
  variant = 'visual',
}: PremiumPlatformHeroBackgroundProps) {
  const [useOriginal, setUseOriginal] = useState(false);
  const imageProps = useMemo(() => getPlatformHeroImageProps(src, variant), [src, variant]);
  const isLcp = variant === 'visual';
  const originalSrc = toObjectPublicUrl(src);

  const preloadSrc = useOriginal
    ? originalSrc
    : (imageProps?.webpSrcSet?.split(',')[0]?.split(' ')[0] ?? imageProps?.src ?? src);
  useLCPImagePreload(
    isLcp ? preloadSrc : '',
    isLcp && !useOriginal ? (imageProps?.webpSrcSet ?? imageProps?.srcSet) : undefined,
    isLcp ? imageProps?.sizes : undefined
  );

  if (!imageProps) return null;

  const photoClass =
    variant === 'left' ? 'lp-platform-hero__left-photo' : 'lp-platform-hero__photo';
  const imgClassName = `${photoClass} pointer-events-none absolute inset-0 h-full w-full object-cover`;

  const handleError = () => {
    if (!useOriginal) setUseOriginal(true);
  };

  if (useOriginal) {
    return (
      <img
        src={originalSrc}
        alt={alt}
        className={imgClassName}
        loading={isLcp ? 'eager' : 'lazy'}
        fetchPriority={isLcp ? 'high' : 'auto'}
        decoding="async"
      />
    );
  }

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
          onError={handleError}
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
      onError={handleError}
    />
  );
}
