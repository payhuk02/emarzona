import SolutionLandingPage from '@/components/solutions/SolutionLandingPage';
import { SOLUTIONS_PAGES } from '@/config/solutions-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-services.png';

export default function ServicesSolutionPage() {
  return <SolutionLandingPage config={SOLUTIONS_PAGES.services} defaultHeroSrc={defaultHeroSrc} />;
}
