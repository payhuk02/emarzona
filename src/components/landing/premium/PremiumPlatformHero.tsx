import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Briefcase, Download, GraduationCap, Package, Palette } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import heroPhysical from '@/assets/landing/platform-hero-physical.webp';
import heroDigital from '@/assets/landing/platform-hero-digital.webp';
import heroService from '@/assets/landing/platform-hero-service.webp';
import heroCourses from '@/assets/landing/platform-hero-courses.webp';
import heroArtist from '@/assets/landing/platform-hero-artist.webp';

export type PlatformHeroVerticalKey = 'physical' | 'digital' | 'service' | 'courses' | 'artist';

const VERTICALS: {
  key: PlatformHeroVerticalKey;
  icon: LucideIcon;
  defaultSrc: string;
}[] = [
  { key: 'physical', icon: Package, defaultSrc: heroPhysical },
  { key: 'digital', icon: Download, defaultSrc: heroDigital },
  { key: 'service', icon: Briefcase, defaultSrc: heroService },
  { key: 'courses', icon: GraduationCap, defaultSrc: heroCourses },
  { key: 'artist', icon: Palette, defaultSrc: heroArtist },
];

const SLIDE_INTERVAL_MS = 5600;
const DEFAULT_BG = '#08080a';
const DEFAULT_TITLE_COLOR = '#f97316';
const DEFAULT_SUBTITLE_COLOR = '#0f0f12';
const DEFAULT_CHIP_TEXT = '#0f0f12';
const DEFAULT_ACCENT = '#f97316';
const DEFAULT_TITLE_MIN = '1.85rem';
const DEFAULT_TITLE_MAX = '6.5rem';
const DEFAULT_SUBTITLE_MIN = '1rem';
const DEFAULT_SUBTITLE_MAX = '2.35rem';
const DEFAULT_CHIP_SIZE = '0.9375rem';
const DEFAULT_TITLE_WEIGHT = '700';
const DEFAULT_SUBTITLE_WEIGHT = '700';

/** Nombre seul → rem ; sinon valeur CSS telle quelle. */
function resolveCssSize(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;
  const v = raw.trim();
  if (/^\d+(\.\d+)?$/.test(v)) return `${v}rem`;
  return v;
}

function resolveCssWeight(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;
  return raw.trim();
}

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

/** URL custom : chaîne vide = image volontairement masquée (admin « Supprimer »). */
function resolveSlideSrc(custom: string | undefined, fallback: string): string | null {
  if (custom === '') return null;
  if (custom && custom.trim()) return custom;
  return fallback;
}

export function PremiumPlatformHero() {
  const { t } = useLandingPremiumT();
  const { pageCustomization } = usePageCustomization(LANDING_PREMIUM_PAGE_ID);
  const { customizationData } = usePlatformCustomizationContext();
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [textKey, setTextKey] = useState(0);

  const customMap =
    (customizationData?.media?.images?.landingPlatformHeroCarousel as
      | Record<string, string>
      | undefined) ?? {};

  const slides = useMemo(
    () =>
      VERTICALS.map(v => ({
        ...v,
        src: resolveSlideSrc(customMap[v.key], v.defaultSrc),
        label: t(`platformHero.checks.${v.key}`),
        titleLine1: t(`platformHero.slides.${v.key}.titleLine1`),
        titleLine2: t(`platformHero.slides.${v.key}.titleLine2`),
        subtitle: t(`platformHero.slides.${v.key}.subtitle`),
        alt: t(`platformHero.slides.${v.key}.alt`),
      })),
    [customMap, t]
  );

  const visibleSlides = useMemo(() => slides.filter(s => s.src), [slides]);
  const slideCount = Math.max(visibleSlides.length, 1);

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % slideCount) + slideCount) % slideCount;
      setActive(next);
      setTextKey(k => k + 1);
    },
    [slideCount]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (active >= slideCount) {
      setActive(0);
      setTextKey(k => k + 1);
    }
  }, [active, slideCount]);

  useEffect(() => {
    if (reducedMotion || paused || slideCount <= 1) return;
    const timer = window.setInterval(next, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [next, paused, reducedMotion, slideCount]);

  const backgroundColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.backgroundColor') ?? DEFAULT_BG;
  const titleColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.titleColor') ??
    getPageCustomizationValue(pageCustomization, 'platformHero.ctaBackgroundColor') ??
    DEFAULT_TITLE_COLOR;
  const subtitleColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.subtitleColor') ??
    DEFAULT_SUBTITLE_COLOR;
  const chipTextColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.chipTextColor') ??
    getPageCustomizationValue(pageCustomization, 'platformHero.textColor') ??
    DEFAULT_CHIP_TEXT;
  const accentColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.accentColor') ??
    getPageCustomizationValue(pageCustomization, 'platformHero.ctaBackgroundColor') ??
    DEFAULT_ACCENT;
  const titleSizeMin = resolveCssSize(
    getPageCustomizationValue(pageCustomization, 'platformHero.titleFontSizeMin'),
    DEFAULT_TITLE_MIN
  );
  const titleSizeMax = resolveCssSize(
    getPageCustomizationValue(pageCustomization, 'platformHero.titleFontSizeMax'),
    DEFAULT_TITLE_MAX
  );
  const subtitleSizeMin = resolveCssSize(
    getPageCustomizationValue(pageCustomization, 'platformHero.subtitleFontSizeMin'),
    DEFAULT_SUBTITLE_MIN
  );
  const subtitleSizeMax = resolveCssSize(
    getPageCustomizationValue(pageCustomization, 'platformHero.subtitleFontSizeMax'),
    DEFAULT_SUBTITLE_MAX
  );
  const chipFontSize = resolveCssSize(
    getPageCustomizationValue(pageCustomization, 'platformHero.chipFontSize'),
    DEFAULT_CHIP_SIZE
  );
  const titleFontWeight = resolveCssWeight(
    getPageCustomizationValue(pageCustomization, 'platformHero.titleFontWeight'),
    DEFAULT_TITLE_WEIGHT
  );
  const subtitleFontWeight = resolveCssWeight(
    getPageCustomizationValue(pageCustomization, 'platformHero.subtitleFontWeight'),
    DEFAULT_SUBTITLE_WEIGHT
  );

  const current = visibleSlides[Math.min(active, visibleSlides.length - 1)] ?? slides[0];

  return (
    <section
      className="lp-platform-hero lp-platform-hero--premium lp-platform-hero--carousel relative w-full overflow-hidden border-b border-white/[0.06] pt-16 sm:pt-[72px] min-h-[92svh] lg:min-h-[100svh]"
      aria-label={t('platformHero.ariaLabel')}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={
        {
          '--lp-platform-hero-title-color': titleColor,
          '--lp-platform-hero-subtitle-color': subtitleColor,
          '--lp-platform-hero-chip-text': chipTextColor,
          '--lp-platform-hero-cta-bg': accentColor,
          '--lp-platform-hero-title-min': titleSizeMin,
          '--lp-platform-hero-title-max': titleSizeMax,
          '--lp-platform-hero-subtitle-min': subtitleSizeMin,
          '--lp-platform-hero-subtitle-max': subtitleSizeMax,
          '--lp-platform-hero-chip-size': chipFontSize,
          '--lp-platform-hero-title-weight': titleFontWeight,
          '--lp-platform-hero-subtitle-weight': subtitleFontWeight,
          backgroundColor,
        } as CSSProperties
      }
    >
      <div className="lp-platform-hero__visual-layer pointer-events-none absolute inset-0 z-[1]">
        <div className="lp-platform-hero__carousel absolute inset-0">
          {visibleSlides.map((slide, index) => (
            <div
              key={slide.key}
              className={`lp-platform-hero__slide ${index === active ? 'is-active' : ''}`}
              aria-hidden={index !== active}
            >
              {slide.src ? (
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="lp-platform-hero__slide-img"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                />
              ) : null}
            </div>
          ))}
          {visibleSlides.length === 0 ? (
            <div className="lp-platform-hero__slide is-active lp-platform-hero__slide--empty" />
          ) : null}
          <div className="lp-platform-hero__shadow" aria-hidden />
        </div>
      </div>

      <div className="lp-platform-hero__frame relative z-[2] mx-auto flex w-full max-w-[100rem] flex-col px-4 sm:px-6 md:px-10 lg:px-8 xl:px-12 2xl:px-14">
        <div className="lp-platform-hero__col-content relative z-[3] mx-auto flex w-full flex-col">
          <div className="lp-platform-hero__content">
            <div
              key={textKey}
              className="lp-platform-hero__copy is-animating mx-auto w-full max-w-5xl text-center"
            >
              <h1 className="lp-platform-hero__title lp-serif">
                <span className="lp-platform-hero__title-line">{current.titleLine1}</span>
                <span className="lp-platform-hero__title-line">{current.titleLine2}</span>
              </h1>
              {current.subtitle.trim() ? (
                <p className="lp-platform-hero__subtitle mx-auto mt-4 max-w-2xl leading-relaxed sm:mt-6 lg:mt-7 lg:max-w-4xl">
                  {current.subtitle}
                </p>
              ) : null}
            </div>

            <ul
              className="lp-platform-hero__checks mt-5 flex w-fit max-w-full flex-col items-start gap-2 self-start sm:mt-8 lg:mt-10"
              role="tablist"
              aria-label={t('platformHero.carouselNavLabel')}
            >
              {visibleSlides.map((slide, index) => {
                const Icon = slide.icon;
                const isActive = index === active;
                return (
                  <li key={slide.key}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`lp-platform-hero__check-item lp-platform-hero__check-btn flex min-w-0 items-center gap-2 font-medium sm:gap-2.5 ${
                        isActive ? 'is-active' : ''
                      }`}
                      onClick={() => goTo(index)}
                    >
                      <span className="lp-platform-hero__check-icon flex h-6 w-6 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7">
                        <Icon
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 hidden sm:inline">{slide.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {!reducedMotion && slideCount > 1 && !paused ? (
              <div
                key={`progress-${active}`}
                className="lp-platform-hero__progress is-running mt-6 mx-auto"
                style={{ animationDuration: `${SLIDE_INTERVAL_MS}ms` }}
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
