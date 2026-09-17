/**
 * Tarifs publics Boost Emarzona — plans de sponsoring marketplace.
 * Fallback local si les SKUs DB ne sont pas encore chargés.
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronRight, Clock, Megaphone, Sparkles } from 'lucide-react';
import { SEOMeta } from '@/components/seo';
import { MarketingPageShell } from '@/components/marketing/MarketingPageShell';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import {
  fetchSponsorshipSkus,
  type SponsorshipSku,
} from '@/lib/sponsorship/marketplace-sponsorship';
import { formatFcfa } from '@/lib/format-currency';
import { cn } from '@/lib/utils';

const ACCENT = '#f97316';

type DisplayPlan = {
  slug: string;
  name: string;
  durationLabel: string;
  priceLabel: string;
  description: string;
  highlight?: boolean;
  features: string[];
};

const FALLBACK_PLANS: DisplayPlan[] = [
  {
    slug: 'boost_7d',
    name: 'Boost 7 jours',
    durationLabel: '7 jours',
    priceLabel: formatFcfa(500),
    description: 'Mise en avant sponsorisée sur le Marketplace pendant une semaine.',
    features: [
      'Badge Sponsorisé sur vos produits',
      'Priorité dans le feed Marketplace',
      'Visibilité dans les recommandations IA',
    ],
  },
  {
    slug: 'boost_30d',
    name: 'Boost 30 jours',
    durationLabel: '1 mois',
    priceLabel: formatFcfa(1000),
    description: 'Mise en avant sponsorisée sur le Marketplace pendant un mois.',
    highlight: true,
    features: [
      'Tout du plan 7 jours',
      'Meilleur rapport durée / prix',
      'Idéal pour lancer une collection',
    ],
  },
];

function skuToDisplayPlan(sku: SponsorshipSku): DisplayPlan {
  const amount = Math.round(sku.price_cents / 100);
  const durationLabel =
    sku.duration_days === 7
      ? '7 jours'
      : sku.duration_days === 30
        ? '1 mois'
        : `${sku.duration_days} jours`;

  return {
    slug: sku.slug,
    name: sku.name,
    durationLabel,
    priceLabel: formatFcfa(amount),
    description:
      sku.description?.trim() ||
      `Mise en avant sponsorisée sur le Marketplace pendant ${durationLabel}.`,
    highlight: sku.duration_days >= 30,
    features: sku.duration_days >= 30 ? FALLBACK_PLANS[1].features : FALLBACK_PLANS[0].features,
  };
}

export default function BoostPricingPage() {
  const { data: skus = [] } = useQuery({
    queryKey: ['marketplace-sponsorship-skus-public'],
    queryFn: fetchSponsorshipSkus,
    staleTime: 60_000,
    retry: 1,
  });

  const plans: DisplayPlan[] =
    skus.length > 0
      ? skus
          .filter(s => s.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(skuToDisplayPlan)
      : FALLBACK_PLANS;

  return (
    <MarketingPageShell>
      <SEOMeta
        title="Tarifs Boost Emarzona | Sponsoring marketplace"
        description="Plans Boost Emarzona : 500 FCFA pour 7 jours ou 1000 FCFA pour 1 mois. Sponsoring produits sur la marketplace."
      />

      <section className="relative bg-[#08080a] text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, ${ACCENT}33 0%, transparent 55%),
              linear-gradient(180deg, #08080a 0%, #0c0c10 100%)`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <nav
            className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-none text-white/40"
            aria-label="Fil d'Ariane"
          >
            <Link
              to="/"
              className="inline-flex items-center leading-none hover:text-white/70 transition-colors"
            >
              Accueil
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            <Link
              to="/features/boost"
              className="inline-flex items-center leading-none hover:text-white/70 transition-colors"
            >
              Boost Emarzona
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            <span className="inline-flex items-center leading-none text-white/60">Tarifs</span>
          </nav>

          <div className="mx-auto max-w-2xl text-center">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide uppercase"
              style={{
                borderColor: `${ACCENT}55`,
                color: ACCENT,
                backgroundColor: `${ACCENT}15`,
              }}
            >
              <Megaphone className="h-3.5 w-3.5" strokeWidth={2} />
              Tarifs Boost
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl leading-[1.1]">
              Des boosts simples,
              <br />
              <span style={{ color: ACCENT }}>à partir de 500 FCFA.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/60">
              Sponsoring marketplace : 7 jours à 500 FCFA, ou 1 mois à 1000 FCFA. Activez depuis
              votre dashboard vendeur.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2 sm:gap-8">
            {plans.map(plan => (
              <article
                key={plan.slug}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-white/[0.03] p-6 sm:p-8',
                  plan.highlight
                    ? 'border-orange-400/40 shadow-[0_0_40px_-12px_rgba(249,115,22,0.45)]'
                    : 'border-white/10'
                )}
              >
                {plan.highlight ? (
                  <span
                    className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Recommandé
                  </span>
                ) : null}

                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden />
                  {plan.durationLabel}
                </div>
                <h2 className="mt-3 text-2xl font-bold text-white">{plan.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight" style={{ color: ACCENT }}>
                    {plan.priceLabel}
                  </span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-white/75">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: ACCENT }}
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <StoreCreateCtaLink
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Commencer
                  <ArrowRight className="h-4 w-4" />
                </StoreCreateCtaLink>
                <Link
                  to="/dashboard/sponsorships"
                  className="mt-3 text-center text-xs text-white/45 hover:text-white/70 transition-colors"
                >
                  Déjà vendeur ? Ouvrir Boost dans le dashboard
                </Link>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-xl text-center text-sm text-white/40">
            Certains plans vendeur incluent un quota Boost. Les campagnes payantes complètent votre
            visibilité marketplace.
          </p>
        </div>
      </section>
    </MarketingPageShell>
  );
}
