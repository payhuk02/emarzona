import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Zap, Headphones } from 'lucide-react';
import { PremiumCompassHeroVisual } from './PremiumCompassHeroVisual';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

const trustIcons = [CreditCard, Zap, Headphones] as const;
const trustKeys = ['noCard', 'instant', 'support'] as const;

const ease = [0.22, 1, 0.36, 1] as const;

export function PremiumHero() {
  const { t } = useLandingPremiumT();

  return (
    <section className="lp-hero relative overflow-hidden bg-[#08080a] pt-16 text-[var(--lp-text-on-dark)] sm:pt-[72px]">
      <div className="pointer-events-none absolute inset-0 lp-hero-grain" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 70% 40%, rgba(124,92,255,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(201,162,39,0.1) 0%, transparent 50%),
            linear-gradient(180deg, #08080a 0%, #0c0c10 100%)`,
        }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-12 sm:px-5 sm:py-14 lg:grid lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-8 lg:px-8 lg:py-20 xl:py-24">
        <div className="flex flex-col text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="lp-eyebrow mb-5 self-center lg:self-start"
          >
            {t('hero.eyebrow')}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08, ease }}
            className="lp-serif text-[2.5rem] leading-[1.08] text-white sm:text-[2.85rem] md:text-[3.35rem] lg:text-[4.5rem] xl:text-[5rem]"
          >
            {t('hero.titleLine1')}
            <br />
            {t('hero.titleLine2')}
            <br />
            <span className="lp-gold-text italic">{t('hero.titleHighlight')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease }}
            className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--lp-text-dim)] sm:text-lg lg:mx-0"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.24, ease }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4 lg:justify-start"
          >
            <Link
              to="/register"
              className="lp-btn-primary inline-flex rounded-full px-6 py-3 text-sm font-semibold sm:px-7 sm:py-3.5"
            >
              {t('hero.ctaPrimary')}
            </Link>
            <a
              href="#solutions"
              className="lp-btn-outline inline-flex rounded-full px-6 py-3 text-sm sm:px-7 sm:py-3.5"
            >
              {t('hero.ctaSecondary')}
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease }}
            className="mt-8 flex flex-col items-center gap-3 text-sm text-white/45 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 lg:items-start lg:justify-start"
          >
            {trustKeys.map((key, i) => {
              const Icon = trustIcons[i];
              return (
                <li key={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-[var(--lp-gold)]/80" strokeWidth={1.5} />
                  {t(`hero.trust.${key}`)}
                </li>
              );
            })}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease }}
          className="flex w-full flex-col items-center lg:items-end"
        >
          <PremiumCompassHeroVisual />
          <p className="lp-hero-caption mt-5 text-center lg:mt-6 lg:text-right">
            {t('hero.caption')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
