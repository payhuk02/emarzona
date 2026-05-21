import { Package, Monitor, Briefcase, GraduationCap, Palette } from 'lucide-react';
import { usePremiumReveal } from './usePremiumReveal';

const ways = [
  {
    icon: Package,
    title: 'Produits physiques',
    desc: 'Stock, variantes, expédition et suivi logistique intégrés.',
    tone: 'amber' as const,
  },
  {
    icon: Monitor,
    title: 'Produits digitaux',
    desc: 'Ebooks, logiciels, templates — livraison instantanée sécurisée.',
    tone: 'violet' as const,
  },
  {
    icon: Briefcase,
    title: 'Services',
    desc: 'Réservations, devis et prestations avec calendrier connecté.',
    tone: 'sky' as const,
  },
  {
    icon: GraduationCap,
    title: 'Cours en ligne',
    desc: 'Formations, drip content, certifications et communauté.',
    tone: 'emerald' as const,
  },
  {
    icon: Palette,
    title: "Œuvres d'artiste",
    desc: "Portfolio, éditions limitées et certificats d'authenticité.",
    tone: 'rose' as const,
  },
];

export function SellWaysSection() {
  const { ref, className } = usePremiumReveal();

  return (
    <section id="solutions" className="lp-section-pad bg-[var(--lp-surface)]">
      <div ref={ref} className={`mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 lp-reveal ${className}`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">
            <span className="lp-eyebrow-dot" aria-hidden />
            Modèles de vente
          </p>
          <h2 className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            Cinq façons de vendre.
            <br />
            <span className="text-[var(--lp-text-muted)]">Une seule plateforme.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            Chaque modèle économique dispose d&apos;outils dédiés, sans plugin ni intégration
            fragile.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          {ways.map((way, i) => (
            <article
              key={way.title}
              className="lp-card lp-sell-way-card group flex flex-col items-center p-6 text-center sm:p-7 lg:items-center lg:text-center"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div
                className={`lp-sell-way-icon lp-sell-way-icon--${way.tone} mb-5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12`}
              >
                <way.icon
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
          ))}
        </div>
      </div>
    </section>
  );
}
