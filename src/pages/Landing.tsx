import { useTranslation } from 'react-i18next';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { WebsiteSchema } from '@/components/seo/WebsiteSchema';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { PremiumLandingPage } from '@/components/landing/premium/PremiumLandingPage';

const Landing = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'landingPremium' });

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
