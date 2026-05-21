import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { formatFcfa } from '@/lib/format/fcfa';
import { usePremiumReveal } from './usePremiumReveal';
import adaptEntrepreneurWebp from '@/assets/landing/adapt-entrepreneur.webp';
import adaptEntrepreneurPng from '@/assets/landing/adapt-entrepreneur.png';
import adaptSmartphoneWebp from '@/assets/landing/adapt-smartphone.webp';

const benefits = [
  'Interface intuitive, pensée pour les créateurs',
  'Aucune compétence technique requise',
  'Boutique en ligne en quelques minutes',
  'Paiements locaux et internationaux',
  'Formation et ressources incluses',
];

export function AdaptSection() {
  const { ref: textRef, className: textReveal } = usePremiumReveal();

  return (
    <section className="lp-section-pad lp-section-muted">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-12 sm:px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div ref={textRef} className={`min-w-0 lp-reveal ${textReveal}`}>
          <p className="lp-eyebrow-light mb-5">
            <span className="lp-eyebrow-dot" aria-hidden />
            Pour tous les profils
          </p>
          <h2 className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            Que vous soyez débutant ou expert, Emarzona{' '}
            <span className="lp-gold-text italic">s&apos;adapte à vous.</span>
          </h2>
          <p className="mt-5 text-[var(--lp-text-muted)] leading-relaxed">
            Lancez votre première offre ce week-end ou industrialisez un catalogue de centaines de
            références — la plateforme grandit avec votre ambition.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map(b => (
              <li key={b} className="flex items-start gap-3 text-sm text-[var(--lp-text)]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--lp-gold)]/15">
                  <Check className="h-3 w-3 text-[var(--lp-gold-deep)]" strokeWidth={2.5} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="lp-btn-gold inline-flex rounded-full px-7 py-3.5 text-sm font-semibold"
            >
              Commencer gratuitement
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex rounded-full border border-[var(--lp-text)]/15 px-7 py-3.5 text-sm font-medium text-[var(--lp-text)] transition-colors hover:border-[var(--lp-text)]/30"
            >
              Explorer le marketplace
            </Link>
          </div>
        </div>

        {/* Visuel toujours visible (hors animation opacity:0) */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:mx-0">
          <div className="lp-adapt-photo relative overflow-hidden rounded-2xl shadow-[0_32px_64px_-32px_rgba(0,0,0,0.25)]">
            <picture>
              <source srcSet={adaptEntrepreneurWebp} type="image/webp" />
              <img
                src={adaptEntrepreneurPng}
                alt="Entrepreneure africaine souriante en costume orange, utilisant son ordinateur portable"
                className="block aspect-[4/5] min-h-[320px] w-full object-cover object-[center_20%] sm:min-h-0"
                loading="lazy"
                width={900}
                height={1125}
                decoding="async"
              />
            </picture>
          </div>

          <div className="lp-adapt-phone pointer-events-none absolute -bottom-3 right-3 z-20 sm:-right-4 sm:bottom-0">
            <img
              src={adaptSmartphoneWebp}
              alt=""
              className="h-[120px] w-[60px] object-cover object-top drop-shadow-[0_16px_32px_rgba(0,0,0,0.35)] sm:h-[168px] sm:w-[84px]"
              width={84}
              height={168}
              loading="lazy"
              decoding="async"
              aria-hidden
            />
          </div>

          <div className="absolute left-3 top-4 z-10 rounded-xl border border-white/60 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:-left-5 sm:top-8 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--lp-text-muted)]">
              Revenus ce mois
            </p>
            <p className="lp-serif mt-1 text-lg text-[var(--lp-text)] sm:text-2xl">
              {formatFcfa(18_726_000)}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600">+24 % vs mois dernier</p>
          </div>

          <div className="absolute bottom-20 right-3 z-10 rounded-xl border border-white/60 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:-right-5 sm:bottom-28 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--lp-text-muted)]">
              Satisfaction
            </p>
            <div className="mt-1 flex gap-0.5 text-[var(--lp-gold)]">
              {'★★★★★'.split('').map((s, i) => (
                <span key={i} className="text-sm">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-[var(--lp-text-muted)]">5,0 / 5 — 450+ avis</p>
          </div>
        </div>
      </div>
    </section>
  );
}
