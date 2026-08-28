import { Helmet } from 'react-helmet-async';
import { LANDING_SEO_DEFAULTS } from '@/lib/landing-seo';

export const SoftwareApplicationSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Emarzona',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'WebBrowser',
    description: LANDING_SEO_DEFAULTS.description,
    url: window.location.origin,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Emarzona',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default SoftwareApplicationSchema;
