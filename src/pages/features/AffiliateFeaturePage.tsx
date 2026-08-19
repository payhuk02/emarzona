import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-affiliate.png';

export default function AffiliateFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.affiliate} defaultHeroSrc={defaultHeroSrc} />;
}
