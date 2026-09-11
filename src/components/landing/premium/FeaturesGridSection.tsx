import {
  Users,
  Link2,
  Store,
  Mail,
  Sparkles,
  Shield,
  BarChart3,
  Globe,
  Gift,
  Repeat,
  Layers,
  Headphones,
  type LucideIcon,
} from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePremiumReveal } from './usePremiumReveal';

const featureIcons = [
  Users,
  Link2,
  Store,
  Mail,
  Sparkles,
  Shield,
  BarChart3,
  Globe,
  Gift,
  Repeat,
  Layers,
  Headphones,
] as const;

type FeatureItem = { title: string; desc: string };

function FeatureCard({ item, Icon }: { item: FeatureItem; Icon: LucideIcon }) {
  return (
    <article className="lp-feature-card lp-reveal-stagger__item group">
      <div
        className="lp-feature-card__glow pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-30 blur-3xl"
        aria-hidden
      />
      <div className="lp-feature-card__icon relative">
        <Icon className="lp-feature-card__svg" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="lp-feature-card__title relative">{item.title}</h3>
      <p className="lp-feature-card__desc relative">{item.desc}</p>
    </article>
  );
}

export function FeaturesGridSection() {
  const { t } = useLandingPremiumT();
  const { ref: sectionRef, className: sectionReveal } = usePremiumReveal(0.08);
  const itemsRaw = t('features.items', { returnObjects: true });
  const items = Array.isArray(itemsRaw) ? (itemsRaw as FeatureItem[]) : [];

  return (
    <section
      id="fonctionnalites"
      className="lp-section-pad lp-section-light border-y border-[var(--lp-border-light)]"
    >
      <div
        ref={sectionRef}
        className={`lp-reveal-stagger mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 ${sectionReveal}`}
      >
        <div className="lp-reveal-stagger__item mx-auto max-w-3xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">{t('features.eyebrow')}</p>
          <h2 className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            {t('features.title')}{' '}
            <span className="lp-gold-text italic">{t('features.titleHighlight')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="lp-feature-grid mt-10 sm:mt-14">
          {items.map((item, i) => {
            const Icon = featureIcons[i % featureIcons.length];
            return <FeatureCard key={`${item.title}-${i}`} item={item} Icon={Icon} />;
          })}
        </div>
      </div>
    </section>
  );
}
