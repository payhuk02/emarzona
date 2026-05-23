import { SEOMeta } from '@/components/seo/SEOMeta';
import { WebsiteSchema } from '@/components/seo/WebsiteSchema';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { PremiumLandingPage } from '@/components/landing/premium/PremiumLandingPage';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

const Landing = () => {
  const { t } = useLandingPremiumT();

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
