import { cn } from '@/lib/utils';
import { EMARZONA_DEFAULT_LOGO, EMARZONA_DEFAULT_LOGO_PUBLIC } from '@/lib/brand/emarzona-logo';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

type EmarzonaBrandLogoProps = {
  variant: 'nav' | 'footer';
  className?: string;
};

/** Logo Emarzona optimisé (WebP + fallback PNG) */
export function EmarzonaBrandLogo({ variant, className }: EmarzonaBrandLogoProps) {
  const { t } = useLandingPremiumT();
  const alt = t('logoAlt');
  const isFooter = variant === 'footer';

  if (isFooter) {
    return (
      <img
        src={EMARZONA_DEFAULT_LOGO}
        alt={alt}
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
    <img
      src={EMARZONA_DEFAULT_LOGO_PUBLIC}
      alt={alt}
      className={cn(
        'block h-full w-auto max-w-[200px] object-contain object-left lg:max-w-[220px]',
        className
      )}
      width={220}
      height={44}
      loading="eager"
      decoding="async"
      fetchpriority="high"
    />
  );
}
