/**
 * Schema.org Organization pour la page d'accueil
 * À utiliser sur la landing page
 */

import { Helmet } from 'react-helmet';

export const OrganizationSchema = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Emarzona',
    alternateName: 'Emarzona - Plateforme de ecommerce et marketing',
    url: 'https://emarzona.com',
    logo: 'https://emarzona.com/emarzona-logo.png',
    description:
      'Plateforme de ecommerce et marketing. Solution SaaS E-commerce pour la vente de produits digitaux, physiques, services et cours en ligne',

    // Contact
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+225-XX-XX-XX-XX', // À compléter
      contactType: 'customer service',
      areaServed: 'CI', // Côte d'Ivoire
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
    url: 'https://emarzona.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://emarzona.com/marketplace?search={search_term_string}',
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






