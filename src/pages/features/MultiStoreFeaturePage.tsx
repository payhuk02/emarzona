import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-multistore.png';

export default function MultiStoreFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.multistore} defaultHeroSrc={defaultHeroSrc} />;
}
