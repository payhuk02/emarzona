/**
 * Template marketing réutilisable pour les 6 pages Solutions.
 * Inspiré des landing pages Shopify / Stripe / Cloudflare.
 */
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';
import { SEOMeta } from '@/components/seo';
import { cn } from '@/lib/utils';
import type { SolutionPageConfig } from '@/config/solutions-pages-config';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { MarketingHeroVisual } from '@/components/marketing/MarketingHeroVisual';
import { usePlatformHeroImage } from '@/hooks/usePlatformHeroImage';
import { marketingHeroSlug } from '@/config/marketing-hero-images';
import { MarketingPageShell } from '@/components/marketing/MarketingPageShell';

type Props = {
  config: SolutionPageConfig;
  defaultHeroSrc: string;
};

export default function SolutionLandingPage({ config, defaultHeroSrc }: Props) {
  const Icon = config.heroIcon;
  const accent = config.accentColor;
  const heroSrc = usePlatformHeroImage(marketingHeroSlug('solutions', config.slug), defaultHeroSrc);

  return (
    <MarketingPageShell>
      <SEOMeta title={config.seoTitle} description={config.seoDescription} />

      {/* ─── HERO ─── */}
      <section
        className="relative bg-[#08080a] text-white"
        style={
          {
            '--accent': accent,
            '--accent-glow': `${accent}33`,
          } as React.CSSProperties
        }
      >
        {/* Background gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 70% 50% at 65% 40%, var(--accent-glow) 0%, transparent 60%),
              linear-gradient(180deg, #08080a 0%, #0c0c10 100%)`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-white/40">
            <Link to="/" className="hover:text-white/70 transition-colors">
              Accueil
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/#solutions" className="hover:text-white/70 transition-colors">
              Solutions
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/60">{config.heroTag}</span>
          </nav>

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left: text */}
            <div className="min-w-0">
              {/* Tag */}
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide uppercase"
                style={{
                  borderColor: `${accent}55`,
                  color: accent,
                  backgroundColor: `${accent}15`,
                }}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {config.heroTag}
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]">
                {config.heroTitle}
                <br />
                <span style={{ color: accent }}>{config.heroTitleHighlight}</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
                {config.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <StoreCreateCtaLink
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  Créer ma boutique gratuitement
                  <ArrowRight className="h-4 w-4" />
                </StoreCreateCtaLink>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 hover:border-white/30 hover:text-white transition-colors"
                >
                  Voir le marketplace
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap gap-8 sm:gap-10">
                {config.statsItems.map(stat => (
                  <div key={stat.label}>
                    <div className="text-3xl font-bold sm:text-4xl" style={{ color: accent }}>
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-white/45">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <MarketingHeroVisual src={heroSrc} alt={config.heroTag} accent={accent} />
            </div>
          </div>

          {/* Stats mobile (hidden on lg — shown inline above) */}
          <div className="mt-14 flex flex-wrap gap-8 sm:gap-12 lg:hidden">
            {config.statsItems.map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-bold sm:text-4xl" style={{ color: accent }}>
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-white/45">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="bg-white border-y border-zinc-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: accent }}
            >
              Catégories supportées
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              Tous les produits de votre secteur, couverts.
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {config.categories.map(cat => {
              const CatIcon = cat.icon;
              return (
                <div
                  key={cat.label}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                    cat.popular
                      ? 'border-zinc-200 bg-zinc-50 text-zinc-800'
                      : 'border-zinc-100 text-zinc-500'
                  )}
                >
                  <CatIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  {cat.label}
                  {cat.popular && (
                    <span
                      className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ backgroundColor: `${accent}20`, color: accent }}
                    >
                      ●
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="bg-zinc-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: accent }}
            >
              Tout ce dont vous avez besoin
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              Des fonctionnalités pensées pour votre activité.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {config.features.map(feature => {
              const FIcon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md sm:p-7"
                >
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${accent}15` }}
                  >
                    <FIcon className="h-5 w-5" style={{ color: accent }} strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-zinc-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: accent }}
            >
              Comment ça marche
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              Lancez-vous en 3 étapes.
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-8">
            {config.steps.map((step, idx) => (
              <div key={step.number} className="flex gap-6">
                <div className="shrink-0">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {step.number}
                  </div>
                  {idx < config.steps.length - 1 && (
                    <div className="mx-auto mt-2 h-8 w-px bg-zinc-200" />
                  )}
                </div>
                <div className="pb-2 pt-2.5">
                  <h3 className="text-lg font-semibold text-zinc-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BOTTOM ─── */}
      <section
        className="py-20 sm:py-28 text-white"
        style={{
          background: `linear-gradient(135deg, #08080a 0%, #0f0f18 100%)`,
        }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accent}20` }}
          >
            <Icon className="h-7 w-7" style={{ color: accent }} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Prêt à vendre vos {config.heroTag.toLowerCase()} ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/55">
            Créez votre boutique en 5 minutes — sans carte bancaire, sans engagement.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <StoreCreateCtaLink
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              Démarrer gratuitement
              <ArrowRight className="h-4 w-4" />
            </StoreCreateCtaLink>
            <Link
              to="/#tarifs"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/75 hover:border-white/30 hover:text-white transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
