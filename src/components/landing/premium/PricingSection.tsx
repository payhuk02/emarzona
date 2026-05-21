import { Link } from 'react-router-dom';
import { Check, Package, Layers } from 'lucide-react';
import { formatFcfa } from '@/lib/format/fcfa';
import { usePremiumReveal } from './usePremiumReveal';

type PricingPlan = {
  icon: typeof Package;
  name: string;
  period: string;
  badge: string;
  desc: string;
  highlight: boolean;
  features: string[];
  cta: string;
  price?: number;
  priceLabel?: string;
};

const plans: PricingPlan[] = [
  {
    icon: Package,
    name: 'Produits physiques',
    price: 7_500,
    period: '/ mois',
    badge: "1 mois d'essai gratuit",
    desc: 'Idéal pour boutiques avec stock, logistique et expédition.',
    highlight: true,
    features: [
      'Boutique en ligne complète',
      'Gestion stock & variantes',
      'Paiements FCFA & international',
      'Marketplace Emarzona',
      'Essai gratuit 30 jours',
    ],
    cta: 'Essayer 1 mois gratuit',
  },
  {
    icon: Layers,
    name: 'Digital, services & créatif',
    priceLabel: '10 %',
    period: 'par vente',
    badge: 'Sans abonnement',
    desc: "Produits digitaux, cours en ligne, services et œuvres d'artistes.",
    highlight: false,
    features: [
      'Aucun frais mensuel fixe',
      '10 % de commission sur ventes réussies',
      'Livraison digitale & réservations',
      "Formations & œuvres d'artiste",
      'Paiements sécurisés inclus',
    ],
    cta: 'Commencer sans abonnement',
  },
];

export function PricingSection() {
  const { ref, className } = usePremiumReveal();

  return (
    <section id="tarifs" className="lp-section-pad lp-section-light">
      <div ref={ref} className={`mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 lp-reveal ${className}`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">
            <span className="lp-eyebrow-dot" aria-hidden />
            Tarifs transparents
          </p>
          <h2 className="lp-serif mt-3 text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            Des prix en <span className="lp-gold-text italic">FCFA</span>, sans surprise
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            Un modèle adapté à chaque type de produit — abonnement pour le physique, commission pour
            le reste.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:mt-14 md:grid-cols-2">
          {plans.map(plan => (
            <article
              key={plan.name}
              className={`lp-pricing-card relative flex flex-col p-6 sm:p-8 ${
                plan.highlight ? 'lp-pricing-card--highlight' : ''
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    plan.highlight
                      ? 'bg-[var(--lp-gold)] text-[#0a0a0c]'
                      : 'border border-[var(--lp-border-light)] bg-white text-[var(--lp-text-muted)]'
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--lp-gold)]/15 bg-[var(--lp-cream)]">
                <plan.icon className="h-5 w-5 text-[var(--lp-gold-deep)]" strokeWidth={1.5} />
              </div>

              <h3 className="text-lg font-semibold text-[var(--lp-text)]">{plan.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                {plan.desc}
              </p>

              <div className="mt-6">
                {plan.price !== undefined ? (
                  <p className="lp-serif text-3xl text-[var(--lp-text)] sm:text-[2rem]">
                    {formatFcfa(plan.price)}
                    <span className="text-base font-sans text-[var(--lp-text-muted)]">
                      {plan.period}
                    </span>
                  </p>
                ) : (
                  <p className="lp-serif text-3xl text-[var(--lp-text)] sm:text-[2rem]">
                    {plan.priceLabel}
                    <span className="text-base font-sans text-[var(--lp-text-muted)]">
                      {' '}
                      {plan.period}
                    </span>
                  </p>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--lp-text)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-gold-deep)]" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`mt-8 inline-flex justify-center rounded-full py-3 text-sm font-semibold ${
                  plan.highlight
                    ? 'lp-btn-gold'
                    : 'border border-[var(--lp-text)]/15 text-[var(--lp-text)] hover:border-[var(--lp-text)]/30'
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-[var(--lp-text-muted)]">
          Tous les montants sont en franc CFA (XOF). Commission de 10 % prélevée uniquement sur les
          ventes abouties pour les produits digitaux, cours, services et œuvres d&apos;artistes.
        </p>
      </div>
    </section>
  );
}
