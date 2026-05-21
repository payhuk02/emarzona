import { Package, Monitor, Briefcase, GraduationCap, Palette } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePremiumReveal } from './usePremiumReveal';

const wayIcons = [Package, Monitor, Briefcase, GraduationCap, Palette] as const;

type SellWayItem = { title: string; desc: string };

export function SellWaysSection() {
  const { t } = useLandingPremiumT();
  const { ref, className } = usePremiumReveal();
  const items = t('sellWays.items', { returnObjects: true }) as SellWayItem[];

  return (
    <section id="solutions" className="lp-section-pad bg-[var(--lp-surface)]">
      <div ref={ref} className={`mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 lp-reveal ${className}`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">{t('sellWays.eyebrow')}</p>
          <h2 className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            {t('sellWays.titleLine1')}
            <br />
            <span className="text-[var(--lp-text-muted)]">{t('sellWays.titleLine2')}</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            {t('sellWays.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          {items.map((way, i) => {
            const Icon = wayIcons[i];
            return (
              <article
                key={way.title}
                className="lp-card lp-sell-way-card group flex flex-col items-center p-6 text-center sm:p-7 lg:items-center lg:text-center"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="lp-sell-way-icon mb-5 inline-flex h-12 w-12 shrink-0 items-center justify-center sm:h-12 sm:w-12">
                  <Icon
                    className="lp-sell-way-icon__svg relative z-10 h-5 w-5"
                    strokeWidth={1.35}
                  />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-[var(--lp-text)]">
                  {way.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                  {way.desc}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
