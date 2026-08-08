import { useMemo, useState, useCallback } from 'react';
import { useLCPImagePreload } from '@/components/ui/OptimizedImage';
import { getPlatformHeroImageProps } from '@/lib/image-transform';

interface PremiumPlatformHeroBackgroundProps {
  src: string;
  alt: string;
}

export function PremiumPlatformHeroBackground({ src, alt }: PremiumPlatformHeroBackgroundProps) {
  const imageProps = useMemo(() => getPlatformHeroImageProps(src), [src]);
  const [loaded, setLoaded] = useState(false);

  const preloadSrc = imageProps?.webpSrcSet?.split(',')[0]?.split(' ')[0] ?? imageProps?.src ?? src;
  useLCPImagePreload(preloadSrc, imageProps?.webpSrcSet ?? imageProps?.srcSet, imageProps?.sizes);

  const handleLoad = useCallback(() => setLoaded(true), []);

  if (!imageProps) return null;

  const imgClassName = `lp-platform-hero__photo pointer-events-none absolute inset-0 h-full w-full object-cover${loaded ? ' is-loaded' : ''}`;

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
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={handleLoad}
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
      loading="eager"
      fetchPriority="high"
      decoding="async"
      onLoad={handleLoad}
    />
  );
}
