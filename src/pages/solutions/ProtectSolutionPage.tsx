import SolutionLandingPage from '@/components/solutions/SolutionLandingPage';
import { SOLUTIONS_PAGES } from '@/config/solutions-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-protect.png';

export default function ProtectSolutionPage() {
  return <SolutionLandingPage config={SOLUTIONS_PAGES.protect} defaultHeroSrc={defaultHeroSrc} />;
}
