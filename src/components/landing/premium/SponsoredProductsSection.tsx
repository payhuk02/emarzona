import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { useLandingSponsoredProducts } from '@/hooks/useLandingSponsoredProducts';
import { usePremiumReveal } from './usePremiumReveal';
import { formatCurrencyCode } from '@/lib/currency-converter';
import { generateProductUrl } from '@/lib/store-utils';
import { recordSponsorshipEvent } from '@/lib/sponsorship/marketplace-sponsorship';
import {
  LANDING_SPONSORED_ROTATE_MS,
  LANDING_SPONSORED_SLOT_COUNT,
  pickSponsoredWindow,
  type LandingSponsoredProduct,
} from '@/lib/sponsorship/landing-sponsored-products';

function StoreMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || 'B';

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
      className="lp-sponsored-card__store-logo"
      onError={() => setFailed(true)}
    />
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
  const href = product.store?.slug
    ? generateProductUrl(product.store.slug, product.slug)
    : `/marketplace?q=${encodeURIComponent(product.name)}`;

  const price =
    product.promotional_price != null && product.promotional_price < product.price
      ? product.promotional_price
      : product.price;
  const showStrike = product.promotional_price != null && product.promotional_price < product.price;

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
    <article className="lp-sponsored-card">
      <Link
        to={href}
        className="lp-sponsored-card__media"
        onClick={handleCtaClick}
        aria-label={product.name}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="lp-sponsored-card__image"
          />
        ) : (
          <div className="lp-sponsored-card__image-fallback" aria-hidden />
        )}
        <div className="lp-sponsored-card__badges">
          <span className="lp-sponsored-card__badge lp-sponsored-card__badge--sponsored">
            <Sparkles className="h-3 w-3" aria-hidden />
            {sponsoredLabel}
          </span>
          <span className="lp-sponsored-card__badge lp-sponsored-card__badge--featured">
            <Star className="h-3 w-3" aria-hidden />
            {featuredLabel}
          </span>
        </div>
      </Link>

      <div className="lp-sponsored-card__body">
        {product.store ? (
          <div className="lp-sponsored-card__store">
            <StoreMark name={product.store.name} logoUrl={product.store.logo_url} />
            <span className="lp-sponsored-card__store-name">{product.store.name}</span>
          </div>
        ) : null}

        <h3 className="lp-sponsored-card__title">
          <Link to={href} onClick={handleCtaClick}>
            {product.name}
          </Link>
        </h3>

        <div className="lp-sponsored-card__footer">
          <div className="lp-sponsored-card__price">
            <span className="lp-sponsored-card__price-now">
              {formatCurrencyCode(price, product.currency || 'XOF')}
            </span>
            {showStrike ? (
              <span className="lp-sponsored-card__price-was">
                {formatCurrencyCode(product.price, product.currency || 'XOF')}
              </span>
            ) : null}
          </div>
          <Link to={href} className="lp-sponsored-card__cta" onClick={handleCtaClick}>
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SponsoredProductsSection() {
  const { t } = useLandingPremiumT();
  const { ref, className } = usePremiumReveal();
  const { data: pool = [], isLoading, isError } = useLandingSponsoredProducts();
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const shouldRotate = pool.length > LANDING_SPONSORED_SLOT_COUNT;

  useEffect(() => {
    if (!shouldRotate) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      setIsAnimating(true);
      window.setTimeout(() => {
        setOffset(prev => prev + 1);
        setIsAnimating(false);
      }, 220);
    }, LANDING_SPONSORED_ROTATE_MS);

    return () => window.clearInterval(id);
  }, [shouldRotate]);

  const visible = useMemo(
    () => pickSponsoredWindow(pool, offset, LANDING_SPONSORED_SLOT_COUNT),
    [pool, offset]
  );

  if (isLoading || isError || visible.length === 0) {
    return null;
  }

  return (
    <section
      id="produits-sponsorises"
      className="lp-section-pad lp-section-muted lp-sponsored-section"
      aria-labelledby="lp-sponsored-heading"
    >
      <div ref={ref} className={`mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 lp-reveal ${className}`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">{t('sponsored.eyebrow')}</p>
          <h2
            id="lp-sponsored-heading"
            className="lp-serif mt-3 text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl"
          >
            {t('sponsored.title')}{' '}
            <span className="lp-gold-text italic">{t('sponsored.titleHighlight')}</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            {t('sponsored.subtitle')}
          </p>
        </div>

        <div
          className={`lp-sponsored-grid mt-10 sm:mt-12${isAnimating ? ' lp-sponsored-grid--swap' : ''}`}
          aria-live="polite"
        >
          {visible.map((product, index) => (
            <SponsoredProductCard
              key={`${product.id}-${index}`}
              product={product}
              ctaLabel={t('sponsored.cta')}
              sponsoredLabel={t('sponsored.badgeSponsored')}
              featuredLabel={t('sponsored.badgeFeatured')}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/marketplace"
            className="lp-btn-outline inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            {t('sponsored.viewMarketplace')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
