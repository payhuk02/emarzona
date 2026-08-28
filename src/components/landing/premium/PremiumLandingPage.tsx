import { lazy, Suspense } from 'react';
import '@/styles/landing-premium.css';
import { PremiumNav } from './PremiumNav';
import { PremiumPlatformHero } from './PremiumPlatformHero';
import { PremiumHero } from './PremiumHero';
import { LandingDeferredSection } from './LandingDeferredSection';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

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
const FinalCtaSection = lazy(() =>
  import('./FinalCtaSection').then(m => ({ default: m.FinalCtaSection }))
);
import { PremiumFooter } from './PremiumFooter';

export function PremiumLandingPage() {
  return (
    <div className="landing-premium min-h-screen overflow-x-clip">
      <PremiumNav />
      <main>
        <PremiumPlatformHero />
        <PremiumHero />

        <LandingDeferredSection minHeight="28rem">
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <SellWaysSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="24rem">
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <FeaturesGridSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="20rem">
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <AdaptSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="10rem">
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <StoresMarqueeSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="8rem">
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <CountriesMarqueeSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="8rem">
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <CurrenciesMarqueeSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="32rem">
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <PricingSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="18rem">
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <FinalCtaSection />
            </Suspense>
          </ErrorBoundary>
        </LandingDeferredSection>
      </main>

      <PremiumFooter />
    </div>
  );
}
