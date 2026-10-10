import { lazy, Suspense, type CSSProperties } from 'react';
import '@/styles/landing-premium.css';
import { PremiumNav } from './PremiumNav';
import { PremiumPlatformHero } from './PremiumPlatformHero';
import { LandingDeferredSection } from './LandingDeferredSection';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { usePrefetchLandingSponsoredProducts } from '@/hooks/useLandingSponsoredProducts';
import { SponsoredProductsSectionFallback } from './SponsoredProductsSectionFallback';

/** Second hero + footer : hors premier viewport — code-split + mount différé */
const PremiumHero = lazy(() => import('./PremiumHero').then(m => ({ default: m.PremiumHero })));
const SellWaysSection = lazy(() =>
  import('./SellWaysSection').then(m => ({ default: m.SellWaysSection }))
);
const FeaturesGridSection = lazy(() =>
  import('./FeaturesGridSection').then(m => ({ default: m.FeaturesGridSection }))
);
const AdaptSection = lazy(() => import('./AdaptSection').then(m => ({ default: m.AdaptSection })));
const StoresMarqueeSection = lazy(() =>
  import('./StoresMarqueeSection').then(m => ({ default: m.StoresMarqueeSection }))
);
const CountriesMarqueeSection = lazy(() =>
  import('./CountriesMarqueeSection').then(m => ({ default: m.CountriesMarqueeSection }))
);
const CurrenciesMarqueeSection = lazy(() =>
  import('./CurrenciesMarqueeSection').then(m => ({ default: m.CurrenciesMarqueeSection }))
);
const PricingSection = lazy(() =>
  import('./PricingSection').then(m => ({ default: m.PricingSection }))
);
const SponsoredProductsSection = lazy(() =>
  import('./SponsoredProductsSection').then(m => ({ default: m.SponsoredProductsSection }))
);
const FinalCtaSection = lazy(() =>
  import('./FinalCtaSection').then(m => ({ default: m.FinalCtaSection }))
);
const PremiumFooter = lazy(() =>
  import('./PremiumFooter').then(m => ({ default: m.PremiumFooter }))
);

function DeferredFallback({
  minHeight,
  className = 'bg-transparent',
}: {
  minHeight: string;
  className?: string;
}) {
  return <div className={className} style={{ minHeight } as CSSProperties} aria-hidden />;
}

export function PremiumLandingPage() {
  // Prefetch avant le scroll : données prêtes quand la section différée monte
  usePrefetchLandingSponsoredProducts();

  return (
    <div className="landing-premium min-h-screen overflow-x-clip">
      <PremiumNav />
      <main>
        {/* Premier viewport uniquement : nav + platform hero */}
        <ErrorBoundary
          level="section"
          fallback={<DeferredFallback minHeight="100dvh" className="bg-[#08080a]" />}
        >
          <PremiumPlatformHero />
        </ErrorBoundary>

        {/* rootMargin serré : ne pas voler la bande passante LCP du platform hero */}
        <LandingDeferredSection minHeight="32rem" rootMargin="60px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="32rem" className="bg-[#08080a]" />}>
              <PremiumHero />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="28rem" rootMargin="220px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="28rem" />}>
              <SellWaysSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="24rem" rootMargin="220px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="24rem" />}>
              <FeaturesGridSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="20rem" rootMargin="200px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="20rem" />}>
              <AdaptSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="10rem" rootMargin="180px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="10rem" />}>
              <StoresMarqueeSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="22rem" rootMargin="180px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="22rem" className="bg-[#08080a]" />}>
              <CountriesMarqueeSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="22rem" rootMargin="180px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="22rem" />}>
              <CurrenciesMarqueeSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="32rem" rootMargin="200px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="32rem" />}>
              <PricingSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="36rem" rootMargin="320px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<SponsoredProductsSectionFallback />}>
              <SponsoredProductsSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="18rem" rootMargin="160px 0px">
          <ErrorBoundary level="section">
            <Suspense fallback={<DeferredFallback minHeight="18rem" />}>
              <FinalCtaSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>
      </main>

      <LandingDeferredSection minHeight="16rem" rootMargin="140px 0px">
        <ErrorBoundary level="section">
          <Suspense fallback={<DeferredFallback minHeight="16rem" />}>
            <PremiumFooter />
          </Suspense>
        </ErrorBoundary>
      </LandingDeferredSection>
    </div>
  );
}
