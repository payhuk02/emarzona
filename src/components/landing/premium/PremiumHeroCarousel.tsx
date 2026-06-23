import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
const SLIDE_WIDTH = 640;
const SLIDE_HEIGHT = 351;

const slides = [
  { key: 'entrepreneur', webp: heroEntrepreneur, webpSm: heroEntrepreneurSm, transparent: true },
  { key: 'physical', webp: heroPhysical, webpSm: heroPhysicalSm, transparent: false },
  { key: 'digital', webp: heroDigital, webpSm: heroDigitalSm, transparent: false },
  { key: 'service', webp: heroService, webpSm: heroServiceSm, transparent: false },
  { key: 'courses', webp: heroCourses, webpSm: heroCoursesSm, transparent: false },
  { key: 'artist', webp: heroArtist, webpSm: heroArtistSm, transparent: false },
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
          return (
            <motion.div
              key={slide.key}
              className={`lp-hero-carousel__slide ${slide.transparent ? 'lp-hero-carousel__slide--transparent' : 'lp-hero-carousel__slide--card'}`}
              aria-hidden={!isActive}
              initial={false}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
            >
              <picture className="lp-hero-carousel__picture">
                <source media="(max-width: 640px)" srcSet={slide.webpSm} type="image/webp" />
                <img
                  src={slide.webp}
                  alt={t(`hero.carousel.slides.${slide.key}.alt`)}
                  className="lp-hero-carousel__img"
                  width={SLIDE_WIDTH}
                  height={SLIDE_HEIGHT}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                  data-no-mobile-opt
                />
              </picture>
            </motion.div>
          );
        })}

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

      <div className="lp-hero-carousel__footer mt-5 flex flex-col items-center gap-4 lg:items-start">
        <p className="lp-hero-caption lp-hero-carousel__caption text-center lg:text-left">
          {t(`hero.carousel.slides.${activeSlide.key}.caption`)}
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
