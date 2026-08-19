import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-email.png';

export default function EmailFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.email} defaultHeroSrc={defaultHeroSrc} />;
}
