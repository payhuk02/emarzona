import { useEffect } from 'react';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { WebsiteSchema } from '@/components/seo/WebsiteSchema';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { PremiumLandingPage } from '@/components/landing/premium/PremiumLandingPage';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

const LANDING_FONTS_ID = 'landing-premium-fonts';
const LANDING_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap';

const Landing = () => {
  const { t } = useLandingPremiumT();

  useEffect(() => {
    if (document.getElementById(LANDING_FONTS_ID)) return;
    const link = document.createElement('link');
    link.id = LANDING_FONTS_ID;
    link.rel = 'stylesheet';
    link.href = LANDING_FONTS_HREF;
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
    };
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <SEOMeta
        title={t('seo.title')}
        description={t('seo.description')}
        url="https://www.emarzona.com/"
      />
      <WebsiteSchema />
      <OrganizationSchema />
      <PremiumLandingPage />
    </>
  );
};

export default Landing;
