import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-referral.png';

export default function ReferralFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.referral} defaultHeroSrc={defaultHeroSrc} />;
}
