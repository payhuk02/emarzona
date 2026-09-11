import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import ctaVisualPremium from '@/assets/landing/cta-visual-premium.png';

/** Visuel CTA final — image premium statique, surchargeable via admin (`landingGlobe`). */
export function PremiumCtaGlobeVisual() {
  const { customizationData } = usePlatformCustomizationContext();

  const customUrl = customizationData?.media?.images?.landingGlobe as string | undefined;
  const imgSrc = customUrl || ctaVisualPremium;

  return (
    <div
      className="lp-cta-visual relative mx-auto aspect-square w-full max-w-[min(92vw,340px)] sm:max-w-[380px] lg:max-w-[400px]"
      aria-hidden
    >
      <div className="lp-cta-visual__halo pointer-events-none absolute inset-[2%] rounded-full" />
      <img
        src={imgSrc}
        alt=""
        className="lp-cta-visual__img relative z-[1] h-full w-full object-contain"
        width={800}
        height={800}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
