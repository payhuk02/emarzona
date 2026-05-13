/**
 * Schema.org Organization pour la page d'accueil
 * À utiliser sur la landing page
 */

import { Helmet } from 'react-helmet-async';

export const OrganizationSchema = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Emarzona',
    alternateName: 'Emarzona - Plateforme de ecommerce et marketing',
    url: 'https://www.emarzona.com',
    logo: 'https://www.emarzona.com/emarzona-logo.png',
    description:
      "Plateforme de ecommerce et marketing. Solution SaaS E-commerce pour la vente de produits digitaux, physiques, services, cours en ligne et œuvres d'artistes",

    // Contact
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@emarzona.com',
      areaServed: ['BF', 'CI', 'SN', 'ML', 'TG', 'BJ'],
      availableLanguage: ['fr', 'en'],
    },

    // Réseaux sociaux (à compléter avec vos URLs réelles)
    sameAs: [
      'https://facebook.com/emarzona',
      'https://twitter.com/emarzona',
      'https://instagram.com/emarzona',
      'https://linkedin.com/company/emarzona',
    ],

    // Fondateurs/CEO (optionnel)
    founder: {
      '@type': 'Person',
      name: 'Emarzona Team',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Emarzona',
    url: 'https://www.emarzona.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.emarzona.com/marketplace?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet>
      {/* Organization Schema */}
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>

      {/* Website Schema avec SearchAction */}
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
    </Helmet>
  );
};
