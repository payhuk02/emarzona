import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { useLandingSponsoredProducts } from '@/hooks/useLandingSponsoredProducts';
import { usePremiumReveal } from './usePremiumReveal';
import { formatCurrencyCode } from '@/lib/currency-converter';
import { recordSponsorshipEvent } from '@/lib/sponsorship/marketplace-sponsorship';
import {
  LANDING_SPONSORED_ROTATE_MS,
  LANDING_SPONSORED_SLOT_COUNT,
  landingSponsoredProductHref,
  pickSponsoredWindow,
  type LandingSponsoredProduct,
} from '@/lib/sponsorship/landing-sponsored-products';

function StoreMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const initial = (name.trim().charAt(0) || 'B').toUpperCase();

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  if (!logoUrl || failed) {
    return (
      <span className="lp-sponsored-card__store-fallback" aria-hidden>
        {initial}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt=""
      width={28}
      height={28}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="lp-sponsored-card__store-logo"
      onError={() => setFailed(true)}
    />
  );
}

function ProductLink({
  href,
  className,
  onClick,
  children,
  ariaLabel,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <Link to={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

function SponsoredProductCard({
  product,
  ctaLabel,
  sponsoredLabel,
  featuredLabel,
}: {
  product: LandingSponsoredProduct;
  ctaLabel: string;
  sponsoredLabel: string;
  featuredLabel: string;
}) {
  const href = landingSponsoredProductHref(product);

  const price =
    product.promotional_price != null && product.promotional_price < product.price
      ? product.promotional_price
      : product.price;

  useEffect(() => {
    if (!product.is_sponsored || !product.active_sponsorship_id) return;
    void recordSponsorshipEvent(product.active_sponsorship_id, 'impression', {
      product_id: product.id,
      source: 'landing_sponsored_grid',
    });
  }, [product.active_sponsorship_id, product.id, product.is_sponsored]);

  const handleCtaClick = () => {
    if (!product.is_sponsored || !product.active_sponsorship_id) return;
    void recordSponsorshipEvent(product.active_sponsorship_id, 'click', {
      product_id: product.id,
      source: 'landing_sponsored_grid',
    });
  };

  return (
    <article className="lp-sponsored-card lp-reveal-stagger__item">
      <div
        className="lp-sponsored-card__glow pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-3xl"
        aria-hidden
      />
      <ProductLink
        href={href}
        className="lp-sponsored-card__media"
        onClick={handleCtaClick}
        ariaLabel={product.name}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="low"
            className="lp-sponsored-card__image"
          />
        ) : (
          <div className="lp-sponsored-card__image-fallback" aria-hidden />
        )}
      </ProductLink>

      <div className="lp-sponsored-card__body">
        <div className="lp-sponsored-card__store-row">
          {product.store ? (
            <div className="lp-sponsored-card__store">
              <StoreMark name={product.store.name} logoUrl={product.store.logo_url} />
              <span className="lp-sponsored-card__store-name">{product.store.name}</span>
            </div>
          ) : (
            <span />
          )}
          <span className="lp-sponsored-card__badge lp-sponsored-card__badge--sponsored">
            <Sparkles className="h-3 w-3" aria-hidden />
            {sponsoredLabel}
          </span>
        </div>

        <h3 className="lp-sponsored-card__title">
          <ProductLink href={href} onClick={handleCtaClick}>
            {product.name}
          </ProductLink>
        </h3>

        <div className="lp-sponsored-card__footer">
          <div className="lp-sponsored-card__price">
            <span className="lp-sponsored-card__price-now">
              {formatCurrencyCode(price, product.currency || 'XOF')}
            </span>
          </div>
          <span className="lp-sponsored-card__badge lp-sponsored-card__badge--featured">
            <Star className="h-3 w-3" aria-hidden />
            {featuredLabel}
          </span>
          <ProductLink href={href} className="lp-sponsored-card__cta" onClick={handleCtaClick}>
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </ProductLink>
        </div>
      </div>
    </article>
  );
}

export function SponsoredProductsSection() {
  const { t } = useLandingPremiumT();
  const { ref, className } = usePremiumReveal(0.06);
  const { data: pool = [], isLoading, isFetching, isError } = useLandingSponsoredProducts();
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const shouldRotate = pool.length > LANDING_SPONSORED_SLOT_COUNT;
  const showSkeleton = isLoading || (isFetching && pool.length === 0);

  useEffect(() => {
    if (!shouldRotate) {
      setOffset(0);
      return;
    }
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      setIsAnimating(true);
      window.setTimeout(() => {
        setOffset(prev => prev + 1);
        setIsAnimating(false);
      }, 280);
    }, LANDING_SPONSORED_ROTATE_MS);

    return () => window.clearInterval(id);
  }, [shouldRotate]);

  const visible = useMemo(
    () => pickSponsoredWindow(pool, offset, LANDING_SPONSORED_SLOT_COUNT),
    [pool, offset]
  );

  if (showSkeleton) {
    return (
      <section
        id="produits-sponsorises"
        className="lp-section-pad lp-section-muted lp-sponsored-section border-y border-[var(--lp-border-light)] aria-busy-skeleton"
        aria-busy="true"
        data-busy-quiet
      >
        <span className="sr-only" role="status">
          Chargement des produits sponsorisés…
        </span>
        <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-black/[0.06]" />
            <div className="mx-auto h-10 max-w-lg animate-pulse rounded-xl bg-black/[0.06]" />
            <div className="mx-auto h-4 max-w-md animate-pulse rounded-lg bg-black/[0.05]" />
          </div>
          <div className="lp-sponsored-grid mt-10 sm:mt-14">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="lp-sponsored-card lp-sponsored-card--skeleton" aria-hidden>
                <div className="lp-sponsored-card__media aspect-[4/3] animate-pulse bg-black/[0.04]" />
                <div className="lp-sponsored-card__body space-y-3">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-black/[0.06]" />
                  <div className="h-5 w-4/5 animate-pulse rounded bg-black/[0.07]" />
                  <div className="h-8 w-full animate-pulse rounded-lg bg-black/[0.05]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || visible.length === 0) {
    return null;
  }

  return (
    <section
      id="produits-sponsorises"
      className="lp-section-pad lp-section-muted lp-sponsored-section border-y border-[var(--lp-border-light)]"
      aria-labelledby="lp-sponsored-heading"
    >
      <div
        ref={ref}
        className={`lp-reveal-stagger mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 ${className}`}
      >
        <div className="lp-reveal-stagger__item mx-auto max-w-3xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">{t('sponsored.eyebrow')}</p>
          <h2
            id="lp-sponsored-heading"
            className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl"
          >
            {t('sponsored.title')}{' '}
            <span className="lp-gold-text italic">{t('sponsored.titleHighlight')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            {t('sponsored.subtitle')}
          </p>
        </div>

        <div
          className={`lp-sponsored-grid mt-10 sm:mt-14${isAnimating ? ' lp-sponsored-grid--swap' : ''}`}
          aria-live="polite"
        >
          {visible.map(product => (
            <SponsoredProductCard
              key={product.id}
              product={product}
              ctaLabel={t('sponsored.cta')}
              sponsoredLabel={t('sponsored.badgeSponsored')}
              featuredLabel={t('sponsored.badgeFeatured')}
            />
          ))}
        </div>

        <div className="lp-reveal-stagger__item mt-10 flex justify-center sm:mt-12">
          <Link
            to="/marketplace"
            className="lp-sponsored-marketplace-btn inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform active:scale-[0.98]"
          >
            {t('sponsored.viewMarketplace')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
