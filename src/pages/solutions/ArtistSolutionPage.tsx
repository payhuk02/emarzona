import SolutionLandingPage from '@/components/solutions/SolutionLandingPage';
import { SOLUTIONS_PAGES } from '@/config/solutions-pages-config';
import defaultHeroSrc from '@/assets/marketing-heroes/hero-artist.png';

export default function ArtistSolutionPage() {
  return <SolutionLandingPage config={SOLUTIONS_PAGES.artist} defaultHeroSrc={defaultHeroSrc} />;
}
