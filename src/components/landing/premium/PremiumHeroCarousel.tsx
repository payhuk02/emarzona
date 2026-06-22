import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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

const SLIDE_INTERVAL_MS = 5500;

const slides = [
  {
    key: 'entrepreneur',
    variant: 'portrait' as const,
    webp: heroEntrepreneur,
    webpSm: heroEntrepreneurSm,
    width: 519,
    height: 720,
  },
  {
    key: 'physical',
    variant: 'banner' as const,
    webp: heroPhysical,
    webpSm: heroPhysicalSm,
    width: 800,
    height: 438,
  },
  {
    key: 'digital',
    variant: 'banner' as const,
    webp: heroDigital,
    webpSm: heroDigitalSm,
    width: 800,
    height: 438,
  },
  {
    key: 'service',
    variant: 'banner' as const,
    webp: heroService,
    webpSm: heroServiceSm,
    width: 800,
    height: 438,
  },
  {
    key: 'courses',
    variant: 'banner' as const,
    webp: heroCourses,
    webpSm: heroCoursesSm,
    width: 800,
    height: 438,
  },
  {
    key: 'artist',
    variant: 'banner' as const,
    webp: heroArtist,
    webpSm: heroArtistSm,
    width: 800,
    height: 438,
  },
] as const;

export function PremiumHeroCarousel() {
  const { t } = useLandingPremiumT();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive((index + slides.length) % slides.length);
  }, []);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const timer = window.setInterval(next, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [next, paused, reducedMotion]);

  const slide = slides[active];

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.key}
            className={`lp-hero-carousel__slide lp-hero-carousel__slide--${slide.variant}`}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.985, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 1.012, y: -8 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <picture>
              <source media="(max-width: 640px)" srcSet={slide.webpSm} type="image/webp" />
              <img
                src={slide.webp}
                alt={t(`hero.carousel.slides.${slide.key}.alt`)}
                className="lp-hero-carousel__img"
                width={slide.width}
                height={slide.height}
                loading={active === 0 ? 'eager' : 'lazy'}
                fetchPriority={active === 0 ? 'high' : 'auto'}
                decoding="async"
                draggable={false}
                data-no-mobile-opt
              />
            </picture>
          </motion.div>
        </AnimatePresence>

        {!reducedMotion && !paused && (
          <motion.div
            className="lp-hero-carousel__progress"
            aria-hidden
            key={`progress-${active}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: SLIDE_INTERVAL_MS / 1000, ease: 'linear' }}
          />
        )}
      </div>

      <div className="lp-hero-carousel__footer mt-5 flex flex-col items-center gap-4 lg:items-end">
        <p className="lp-hero-caption text-center lg:text-right">
          {t(`hero.carousel.slides.${slide.key}.caption`)}
        </p>

        <div
          className="lp-hero-carousel__dots flex items-center gap-2"
          role="tablist"
          aria-label={t('hero.carousel.navLabel')}
        >
          {slides.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={t(`hero.carousel.slides.${item.key}.label`)}
              className={`lp-hero-carousel__dot ${index === active ? 'is-active' : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
