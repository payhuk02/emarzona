import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-boost.png';

export default function BoostFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.boost} defaultHeroSrc={defaultHeroSrc} />;
}
