import SolutionLandingPage from '@/components/solutions/SolutionLandingPage';
import { SOLUTIONS_PAGES } from '@/config/solutions-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-physical.png';

export default function PhysicalSolutionPage() {
  return <SolutionLandingPage config={SOLUTIONS_PAGES.physical} defaultHeroSrc={defaultHeroSrc} />;
}
