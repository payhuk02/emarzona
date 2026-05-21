import { Package, Monitor, Briefcase, GraduationCap, Palette } from 'lucide-react';
import { usePremiumReveal } from './usePremiumReveal';

const ways = [
  {
    icon: Package,
    title: 'Produits physiques',
    desc: 'Stock, variantes, expédition et suivi logistique intégrés.',
    color: 'text-amber-700',
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/80',
  },
  {
    icon: Monitor,
    title: 'Produits digitaux',
    desc: 'Ebooks, logiciels, templates — livraison instantanée sécurisée.',
    color: 'text-violet-700',
    bg: 'bg-gradient-to-br from-violet-50 to-violet-100/80',
  },
  {
    icon: Briefcase,
    title: 'Services',
    desc: 'Réservations, devis et prestations avec calendrier connecté.',
    color: 'text-sky-700',
    bg: 'bg-gradient-to-br from-sky-50 to-sky-100/80',
  },
  {
    icon: GraduationCap,
    title: 'Cours en ligne',
    desc: 'Formations, drip content, certifications et communauté.',
    color: 'text-emerald-700',
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/80',
  },
  {
    icon: Palette,
    title: "Œuvres d'artiste",
    desc: "Portfolio, éditions limitées et certificats d'authenticité.",
    color: 'text-rose-700',
    bg: 'bg-gradient-to-br from-rose-50 to-rose-100/80',
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
              className="lp-card group flex flex-col items-center p-6 text-center sm:items-start sm:p-7 sm:text-left"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div
                className={`mb-5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${way.bg} ring-1 ring-black/[0.04] sm:mx-0`}
              >
                <way.icon className={`h-5 w-5 ${way.color}`} strokeWidth={1.5} />
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
