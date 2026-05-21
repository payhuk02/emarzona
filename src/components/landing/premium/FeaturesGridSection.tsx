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
import { usePremiumReveal } from './usePremiumReveal';

const features = [
  {
    icon: Users,
    title: 'Parrainage',
    desc: 'Programme de parrainage avec commissions automatiques.',
  },
  {
    icon: Link2,
    title: 'Affiliation',
    desc: "Réseau d'affiliés et liens trackés pour chaque produit.",
  },
  {
    icon: Store,
    title: 'Marketplace',
    desc: 'Visibilité sur le marketplace Emarzona et votre boutique.',
  },
  {
    icon: Mail,
    title: 'Marketing e-mail',
    desc: 'Campagnes, séquences et récupération de paniers.',
  },
  {
    icon: Sparkles,
    title: 'IA intégrée',
    desc: 'Recommandations et insights pour optimiser vos ventes.',
  },
  {
    icon: Shield,
    title: 'Paiements sécurisés',
    desc: 'Moneroo, mobile money et cartes — conformes et fiables.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Tableaux de bord temps réel et rapports exportables.',
  },
  {
    icon: Globe,
    title: 'Multi-devises',
    desc: 'FCFA (XOF) natif — EUR, USD et mobile money à la caisse.',
  },
  {
    icon: Gift,
    title: 'Coupons & promos',
    desc: 'Codes promo, bundles et offres limitées dans le temps.',
  },
  { icon: Repeat, title: 'Abonnements', desc: 'Revenus récurrents sur produits et services.' },
  {
    icon: Layers,
    title: 'Multi-boutiques',
    desc: 'Gérez plusieurs marques depuis un seul compte.',
  },
  {
    icon: Headphones,
    title: 'Support dédié',
    desc: 'Accompagnement humain pour les vendeurs ambitieux.',
  },
];

export function FeaturesGridSection() {
  const { ref, className } = usePremiumReveal();

  return (
    <section
      id="fonctionnalites"
      className="lp-section-pad lp-section-light border-y border-[var(--lp-border-light)]"
    >
      <div ref={ref} className={`mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 lp-reveal ${className}`}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">
            <span className="lp-eyebrow-dot" aria-hidden />
            Infrastructure
          </p>
          <h2 className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            Des outils puissants pour développer{' '}
            <span className="lp-gold-text italic">votre business</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            De la première vente à l&apos;échelle internationale — sans empiler dix outils
            différents.
          </p>
        </div>

        <div className="mt-10 grid gap-2 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="lp-feature-cell group flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--lp-gold)]/15 bg-gradient-to-br from-[var(--lp-cream)] to-white shadow-sm">
                <f.icon
                  className="h-[18px] w-[18px] text-[var(--lp-gold-deep)]"
                  strokeWidth={1.5}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold tracking-tight text-[var(--lp-text)]">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
