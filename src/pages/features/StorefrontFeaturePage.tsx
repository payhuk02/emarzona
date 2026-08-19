import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-storefront.png';

export default function StorefrontFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.storefront} defaultHeroSrc={defaultHeroSrc} />;
}
