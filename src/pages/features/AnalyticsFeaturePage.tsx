import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-analytics.png';

export default function AnalyticsFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.analytics} defaultHeroSrc={defaultHeroSrc} />;
}
