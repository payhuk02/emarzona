/**
 * Schema.org Organization pour la page d'accueil
 * WebSite + SearchAction : voir WebsiteSchema.tsx
 */

import { Helmet } from 'react-helmet-async';
import { LANDING_SEO_DEFAULTS } from '@/lib/landing-seo';

export const OrganizationSchema = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Emarzona',
    alternateName: 'Emarzona',
    url: 'https://www.emarzona.com',
    logo: 'https://www.emarzona.com/emarzona-logo.png',
    description: LANDING_SEO_DEFAULTS.description,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@emarzona.com',
      areaServed: ['BF', 'CI', 'SN', 'ML', 'TG', 'BJ'],
      availableLanguage: ['fr', 'en'],
    },
    sameAs: [
      'https://facebook.com/emarzona',
      'https://twitter.com/emarzona',
      'https://instagram.com/emarzona',
      'https://linkedin.com/company/emarzona',
    ],
    founder: {
      '@type': 'Person',
      name: 'Emarzona Team',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
    </Helmet>
  );
};
