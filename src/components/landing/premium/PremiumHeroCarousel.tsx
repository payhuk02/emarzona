import { useCallback, useEffect, useState } from 'react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

import heroEntrepreneur from '@/assets/landing/hero-carousel-entrepreneur.webp';
import heroEntrepreneurSm from '@/assets/landing/hero-carousel-entrepreneur-480.webp';
import heroPhysical from '@/assets/landing/hero-carousel-physical.webp';
import heroPhysicalSm from '@/assets/landing/hero-carousel-physical-480.webp';
import heroDigital from '@/assets/landing/hero-carousel-digital.webp';
import heroDigitalSm from '@/assets/landing/hero-carousel-digital-480.webp';
import heroService from '@/assets/landing/hero-carousel-service.webp';
import heroServiceSm from '@/assets/landing/hero-carousel-service-480.webp';
import heroCourses from '@/assets/landing/hero-carousel-courses.webp';
import heroCoursesSm from '@/assets/landing/hero-carousel-courses-480.webp';
import heroArtist from '@/assets/landing/hero-carousel-artist.webp';
import heroArtistSm from '@/assets/landing/hero-carousel-artist-480.webp';

import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';

const SLIDE_INTERVAL_MS = 5500;
const SLIDE_WIDTH = 640;
const SLIDE_HEIGHT = 351;

const defaultSlides = [
  { key: 'entrepreneur', webp: heroEntrepreneur, webpSm: heroEntrepreneurSm, transparent: true },
  { key: 'physical', webp: heroPhysical, webpSm: heroPhysicalSm, transparent: false },
  { key: 'digital', webp: heroDigital, webpSm: heroDigitalSm, transparent: false },
  { key: 'service', webp: heroService, webpSm: heroServiceSm, transparent: false },
  { key: 'courses', webp: heroCourses, webpSm: heroCoursesSm, transparent: false },
  { key: 'artist', webp: heroArtist, webpSm: heroArtistSm, transparent: false },
] as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export function PremiumHeroCarousel() {
  const { t } = useLandingPremiumT();
  const { customizationData } = usePlatformCustomizationContext();
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const customCarouselImages = customizationData?.media?.images?.landingCarousel || {};

  const slides = defaultSlides.map(slide => {
    const customUrl = customCarouselImages[slide.key];
    return {
      ...slide,
      webp: customUrl || slide.webp,
      webpSm: customUrl || slide.webpSm,
    };
  });

  const goTo = useCallback(
    (index: number) => {
      setActive((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const timer = window.setInterval(next, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [next, paused, reducedMotion]);

  const activeSlide = slides[active];

  return (
    <div
      className="lp-hero-carousel relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="lp-hero-carousel__ambient pointer-events-none absolute inset-[2%] -z-10"
        aria-hidden
      />

      <div className="lp-hero-carousel__stage relative">
        {slides.map((slide, index) => {
          const isActive = index === active;
          const isCustom = !!customCarouselImages[slide.key];
          return (
            <div
              key={slide.key}
              className={`lp-hero-carousel__slide ${
                slide.transparent
                  ? 'lp-hero-carousel__slide--transparent'
                  : 'lp-hero-carousel__slide--card'
              } ${isActive ? 'is-active' : ''}`}
              aria-hidden={!isActive}
            >
              <picture className="lp-hero-carousel__picture">
                {!isCustom && (
                  <source media="(max-width: 640px)" srcSet={slide.webpSm} type="image/webp" />
                )}
                <img
                  src={slide.webp}
                  alt={t(`hero.carousel.slides.${slide.key}.alt`)}
                  className="lp-hero-carousel__img"
                  width={SLIDE_WIDTH}
                  height={SLIDE_HEIGHT}
                  loading="lazy"
                  fetchPriority="auto"
                  decoding="async"
                  draggable={false}
                  data-no-mobile-opt
                />
              </picture>
            </div>
          );
        })}

        {!reducedMotion && !paused && (
          <div
            key={`progress-${active}`}
            className="lp-hero-carousel__progress is-running"
            style={{ animationDuration: `${SLIDE_INTERVAL_MS}ms` }}
            aria-hidden
          />
        )}
      </div>

      <div className="lp-hero-carousel__footer mt-5 flex flex-col items-center lg:items-start">
        <p className="lp-hero-carousel__caption lp-hero-caption text-center lg:text-left">
          {t(`hero.carousel.slides.${activeSlide.key}.caption`)}
        </p>
      </div>
    </div>
  );
}
