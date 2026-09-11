import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Briefcase, Check, GraduationCap, Monitor, Package, Palette } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import { usePremiumReveal } from './usePremiumReveal';
import sellWayPhysical from '@/assets/landing/sell-way-physical.webp';
import sellWayPhysicalSm from '@/assets/landing/sell-way-physical-480.webp';
import sellWayDigital from '@/assets/landing/sell-way-digital.webp';
import sellWayDigitalSm from '@/assets/landing/sell-way-digital-480.webp';
import sellWayService from '@/assets/landing/sell-way-service.webp';
import sellWayServiceSm from '@/assets/landing/sell-way-service-480.webp';
import sellWayCourses from '@/assets/landing/sell-way-courses.webp';
import sellWayCoursesSm from '@/assets/landing/sell-way-courses-480.webp';
import sellWayArtist from '@/assets/landing/sell-way-artist.webp';
import sellWayArtistSm from '@/assets/landing/sell-way-artist-480.webp';

export type SellWayId = 'physical' | 'digital' | 'service' | 'courses' | 'artist';

type SellWayItem = {
  id?: string;
  title: string;
  desc: string;
  bullets?: string[];
  cta?: string;
  imageAlt?: string;
};

const WAY_META: {
  id: SellWayId;
  icon: LucideIcon;
  href: string;
  defaultImage: string;
  defaultImageSm: string;
}[] = [
  {
    id: 'physical',
    icon: Package,
    href: '/solutions/physical',
    defaultImage: sellWayPhysical,
    defaultImageSm: sellWayPhysicalSm,
  },
  {
    id: 'digital',
    icon: Monitor,
    href: '/solutions/digital',
    defaultImage: sellWayDigital,
    defaultImageSm: sellWayDigitalSm,
  },
  {
    id: 'service',
    icon: Briefcase,
    href: '/solutions/services',
    defaultImage: sellWayService,
    defaultImageSm: sellWayServiceSm,
  },
  {
    id: 'courses',
    icon: GraduationCap,
    href: '/solutions/courses',
    defaultImage: sellWayCourses,
    defaultImageSm: sellWayCoursesSm,
  },
  {
    id: 'artist',
    icon: Palette,
    href: '/solutions/artist',
    defaultImage: sellWayArtist,
    defaultImageSm: sellWayArtistSm,
  },
];

function SellWayBlock({
  item,
  meta,
  index,
  customImageUrl,
}: {
  item: SellWayItem;
  meta: (typeof WAY_META)[number];
  index: number;
  customImageUrl?: string;
}) {
  const { ref: blockRef, className: blockReveal } = usePremiumReveal(0.08);
  const Icon = meta.icon;
  const imageLeft = index % 2 === 0;
  const hasCustom = Boolean(customImageUrl);
  const imgSrc = customImageUrl || meta.defaultImage;
  const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
  const muted = index % 2 === 1;
  const visualFrom = imageLeft ? 'lp-reveal--from-left' : 'lp-reveal--from-right';
  const copyFrom = imageLeft ? 'lp-reveal--from-right' : 'lp-reveal--from-left';

  const visual = (
    <div
      className={`lp-sell-way-visual relative mx-auto w-full max-w-full lg:mx-0 lp-reveal lp-reveal--soft-scale ${visualFrom}`}
    >
      <div className="lp-sell-way-photo relative h-full w-full overflow-hidden rounded-2xl shadow-[0_32px_64px_-32px_rgba(0,0,0,0.25)]">
        <picture>
          {!hasCustom ? (
            <source
              type="image/webp"
              srcSet={`${meta.defaultImageSm} 960w, ${meta.defaultImage} 1600w`}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : null}
          <img
            src={imgSrc}
            alt={item.imageAlt || item.title}
            loading="lazy"
            fetchPriority="auto"
            width={1600}
            height={1200}
            sizes="(max-width: 1024px) 100vw, 50vw"
            decoding="async"
            data-no-mobile-opt
            className="lp-sell-way-photo__img h-full w-full object-cover"
          />
        </picture>
      </div>
    </div>
  );

  const content = (
    <div
      className={`lp-sell-way-copy min-w-0 w-full max-w-full lp-reveal lp-reveal--delay ${copyFrom} flex flex-col items-center justify-center text-center`}
    >
      <div className="lp-sell-way-icon mb-5 inline-flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
        <Icon
          className="lp-sell-way-icon__svg relative z-10 h-6 w-6 sm:h-7 sm:w-7"
          strokeWidth={1.35}
        />
      </div>
      <h3 className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
        {item.title}
      </h3>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--lp-text-muted)] sm:text-lg">
        {item.desc}
      </p>
      {bullets.length > 0 ? (
        <ul className="mx-auto mt-6 w-fit max-w-full space-y-3 text-left">
          {bullets.map(bullet => (
            <li
              key={bullet}
              className="flex items-start gap-3 text-sm text-[var(--lp-text)] sm:text-[15px]"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--lp-blue)]/12">
                <Check className="h-3 w-3 text-[var(--lp-blue)]" strokeWidth={2.5} aria-hidden />
              </span>
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
      {item.cta ? (
        <div className="mt-8">
          <Link
            to={meta.href}
            className="lp-btn-outline-light inline-flex rounded-full px-7 py-3.5 text-sm font-semibold"
          >
            {item.cta}
          </Link>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      ref={blockRef}
      className={`lp-sell-way-block ${muted ? 'lp-section-muted' : 'bg-[var(--lp-surface)]'} ${blockReveal}`}
    >
      <div
        className={`lp-sell-way-pair mx-auto grid max-w-7xl gap-10 px-4 sm:gap-12 sm:px-5 lg:grid-cols-2 lg:items-stretch lg:gap-16 lg:px-8 ${
          imageLeft ? '' : 'lg:[&>*:first-child]:order-2'
        }`}
      >
        {visual}
        {content}
      </div>
    </div>
  );
}

export function SellWaysSection() {
  const { t } = useLandingPremiumT();
  const { customizationData } = usePlatformCustomizationContext();
  const { ref: introRef, className: introReveal } = usePremiumReveal();

  const itemsRaw = t('sellWays.items', { returnObjects: true });
  const items = Array.isArray(itemsRaw) ? (itemsRaw as SellWayItem[]) : [];
  const sellWayImages =
    (customizationData?.media?.images?.landingSellWays as
      | Partial<Record<SellWayId, string>>
      | undefined) ?? {};

  return (
    <section id="solutions" className="bg-[var(--lp-surface)]">
      <div className="lp-section-pad pb-10 sm:pb-12">
        <div
          ref={introRef}
          className={`mx-auto max-w-3xl px-4 text-center sm:px-5 lg:px-8 lp-reveal ${introReveal}`}
        >
          <p className="lp-eyebrow-light mx-auto mb-6 text-sm sm:text-base">
            {t('sellWays.eyebrow')}
          </p>
          <h2 className="lp-serif text-4xl text-[var(--lp-text)] sm:text-5xl lg:text-6xl">
            {t('sellWays.titleLine1')}
            <br />
            <span className="text-[var(--lp-text-muted)]">{t('sellWays.titleLine2')}</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--lp-text-muted)] sm:text-lg lg:text-xl">
            {t('sellWays.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        {WAY_META.map((meta, index) => {
          const item =
            items.find(entry => entry.id === meta.id) ??
            items[index] ??
            ({ title: meta.id, desc: '' } satisfies SellWayItem);

          return (
            <SellWayBlock
              key={meta.id}
              item={item}
              meta={meta}
              index={index}
              customImageUrl={sellWayImages[meta.id]}
            />
          );
        })}
      </div>
    </section>
  );
}
