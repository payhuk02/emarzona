import { lazy, Suspense } from 'react';
import '@/styles/landing-premium.css';
import { PremiumNav } from './PremiumNav';
import { PremiumHero } from './PremiumHero';
import { LandingDeferredSection } from './LandingDeferredSection';

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
const PremiumFooter = lazy(() =>
  import('./PremiumFooter').then(m => ({ default: m.PremiumFooter }))
);

export function PremiumLandingPage() {
  return (
    <div className="landing-premium min-h-screen overflow-x-clip">
      <PremiumNav />
      <main>
        <PremiumHero />

        <LandingDeferredSection minHeight="28rem">
          <Suspense fallback={null}>
            <SellWaysSection />
          </Suspense>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="24rem">
          <Suspense fallback={null}>
            <FeaturesGridSection />
          </Suspense>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="20rem">
          <Suspense fallback={null}>
            <AdaptSection />
          </Suspense>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="10rem">
          <Suspense fallback={null}>
            <StoresMarqueeSection />
          </Suspense>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="8rem">
          <Suspense fallback={null}>
            <CountriesMarqueeSection />
          </Suspense>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="8rem">
          <Suspense fallback={null}>
            <CurrenciesMarqueeSection />
          </Suspense>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="32rem">
          <Suspense fallback={null}>
            <PricingSection />
          </Suspense>
        </LandingDeferredSection>

        <LandingDeferredSection minHeight="18rem">
          <Suspense fallback={null}>
            <FinalCtaSection />
          </Suspense>
        </LandingDeferredSection>
      </main>

      <Suspense fallback={null}>
        <PremiumFooter />
      </Suspense>
    </div>
  );
}
