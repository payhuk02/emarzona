import { cn } from '@/lib/utils';
import {
  EMARZONA_DEFAULT_LOGO,
  EMARZONA_DEFAULT_LOGO_PUBLIC,
  EMARZONA_LOGO_WEBP_PUBLIC,
} from '@/lib/brand/emarzona-logo';

type EmarzonaBrandLogoProps = {
  variant: 'nav' | 'footer';
  className?: string;
};

/** Logo Emarzona optimisé (WebP + fallback PNG) */
export function EmarzonaBrandLogo({ variant, className }: EmarzonaBrandLogoProps) {
  const isFooter = variant === 'footer';

  if (isFooter) {
    return (
      <img
        src={EMARZONA_DEFAULT_LOGO}
        alt="Emarzona — plateforme e-commerce"
        className={cn(
          'lp-footer-logo-img block h-11 w-auto min-h-[44px] min-w-[140px] max-w-[min(100%,220px)] object-contain object-left sm:h-12',
          className
        )}
        width={220}
        height={52}
        loading="eager"
        decoding="async"
      />
    );
  }

  return (
    <picture className={cn('block', className)}>
      <source srcSet={EMARZONA_LOGO_WEBP_PUBLIC} type="image/webp" />
      <img
        src={EMARZONA_DEFAULT_LOGO_PUBLIC}
        alt="Emarzona — plateforme e-commerce"
        className="block h-12 w-auto max-w-[min(100%,200px)] object-contain object-left sm:h-[52px] sm:max-w-[240px] lg:h-14 lg:max-w-[280px]"
        width={280}
        height={56}
        loading="eager"
        decoding="async"
        fetchpriority="high"
      />
    </picture>
  );
}
