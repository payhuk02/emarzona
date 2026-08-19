import SolutionLandingPage from '@/components/solutions/SolutionLandingPage';
import { SOLUTIONS_PAGES } from '@/config/solutions-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-digital.png';

export default function DigitalSolutionPage() {
  return <SolutionLandingPage config={SOLUTIONS_PAGES.digital} defaultHeroSrc={defaultHeroSrc} />;
}
