import '@/styles/landing-premium.css';
import { PremiumNav } from './PremiumNav';
import { PremiumHero } from './PremiumHero';
import { SellWaysSection } from './SellWaysSection';
import { FeaturesGridSection } from './FeaturesGridSection';
import { AdaptSection } from './AdaptSection';
import { StoresMarqueeSection } from './StoresMarqueeSection';
import { PricingSection } from './PricingSection';
import { FinalCtaSection } from './FinalCtaSection';
import { PremiumFooter } from './PremiumFooter';

export function PremiumLandingPage() {
  return (
    <div className="landing-premium min-h-screen overflow-x-hidden">
      <PremiumNav />
      <main>
        <PremiumHero />
        <SellWaysSection />
        <FeaturesGridSection />
        <AdaptSection />
        <StoresMarqueeSection />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <PremiumFooter />
    </div>
  );
}
