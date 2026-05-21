import { SEOMeta } from '@/components/seo/SEOMeta';
import { WebsiteSchema } from '@/components/seo/WebsiteSchema';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { PremiumLandingPage } from '@/components/landing/premium/PremiumLandingPage';

const Landing = () => {
  return (
    <>
      <SEOMeta
        title="Emarzona — Vendez tout. Gérez tout. Sans limites."
        description="Plateforme e-commerce premium : produits digitaux, physiques, services, cours et œuvres d'artiste. Paiements sécurisés, marketing intégré, marketplace Afrique."
        url="https://www.emarzona.com/"
      />
      <WebsiteSchema />
      <OrganizationSchema />
      <PremiumLandingPage />
    </>
  );
};

export default Landing;
