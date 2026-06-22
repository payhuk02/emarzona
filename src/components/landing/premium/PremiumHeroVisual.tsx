import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import heroEntrepreneurWebp from '@/assets/landing/hero-entrepreneur.webp';
import heroEntrepreneurWebpLg from '@/assets/landing/hero-entrepreneur-960.webp';
import heroEntrepreneurWebpSm from '@/assets/landing/hero-entrepreneur-480.webp';

const heroSrcSet = `${heroEntrepreneurWebpSm} 346w, ${heroEntrepreneurWebp} 519w, ${heroEntrepreneurWebpLg} 692w`;

export function PremiumHeroVisual() {
  const { t } = useLandingPremiumT();

  return (
    <div className="lp-hero-visual relative w-full">
      <div
        className="lp-hero-visual__ambient pointer-events-none absolute inset-[2%] -z-10"
        aria-hidden
      />
      <picture className="lp-hero-visual__frame block">
        <source
          srcSet={heroSrcSet}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 52vw, 519px"
          type="image/webp"
        />
        <img
          src={heroEntrepreneurWebp}
          srcSet={heroSrcSet}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 52vw, 519px"
          alt={t('hero.photoAlt')}
          className="lp-hero-visual__img"
          width={519}
          height={720}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          data-no-mobile-opt
        />
      </picture>
    </div>
  );
}
