import FeatureLandingPage from '@/components/features/FeatureLandingPage';
import { FEATURES_PAGES } from '@/config/features-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-whatsapp.png';

export default function WhatsappFeaturePage() {
  return <FeatureLandingPage config={FEATURES_PAGES.whatsapp} defaultHeroSrc={defaultHeroSrc} />;
}
