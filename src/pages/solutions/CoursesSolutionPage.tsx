import SolutionLandingPage from '@/components/solutions/SolutionLandingPage';
import { SOLUTIONS_PAGES } from '@/config/solutions-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-courses.png';

export default function CoursesSolutionPage() {
  return <SolutionLandingPage config={SOLUTIONS_PAGES.courses} defaultHeroSrc={defaultHeroSrc} />;
}
