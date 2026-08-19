import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-checkout.png';

export default function CheckoutFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.checkout} defaultHeroSrc={defaultHeroSrc} />;
}
