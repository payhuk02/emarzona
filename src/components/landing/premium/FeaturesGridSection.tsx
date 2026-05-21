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

export function FeaturesGridSection() {
  const { t } = useLandingPremiumT();
  const { ref, className } = usePremiumReveal();
  const items = t('features.items', { returnObjects: true }) as FeatureItem[];

  return (
    <section
      id="fonctionnalites"
      className="lp-section-pad lp-section-light border-y border-[var(--lp-border-light)]"
    >
      <div ref={ref} className={`mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 lp-reveal ${className}`}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">{t('features.eyebrow')}</p>
          <h2 className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            {t('features.title')}{' '}
            <span className="lp-gold-text italic">{t('features.titleHighlight')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="mt-10 grid gap-2 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {items.map((f, i) => {
            const Icon = featureIcons[i];
            return (
              <div key={f.title} className="lp-feature-cell group flex gap-4">
                <div className="lp-feature-icon h-11 w-11">
                  <Icon className="h-[22px] w-[22px] text-[var(--lp-text)]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold tracking-tight text-[var(--lp-text)]">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
