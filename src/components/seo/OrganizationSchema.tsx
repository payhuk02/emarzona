/**
 * Schema.org Organization pour la page d'accueil
 * À utiliser sur la landing page
 */

import { Helmet } from 'react-helmet';

export const OrganizationSchema = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Payhuk',
    alternateName: 'Payhuk SaaS',
    url: 'https://payhuk.com',
    logo: 'https://payhuk.com/assets/payhuk-logo.png',
    description: 'Plateforme SaaS de e-commerce pour la vente de produits digitaux, physiques et services en Afrique de l\'Ouest',
    
    // Contact
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+225-XX-XX-XX-XX', // À compléter
      contactType: 'customer service',
      areaServed: 'CI', // Côte d'Ivoire
      availableLanguage: ['fr', 'en']
    },
    
    // Réseaux sociaux (à compléter avec vos URLs réelles)
    sameAs: [
      'https://facebook.com/payhuk',
      'https://twitter.com/payhuk',
      'https://instagram.com/payhuk',
      'https://linkedin.com/company/payhuk'
    ],
    
    // Fondateurs/CEO (optionnel)
    founder: {
      '@type': 'Person',
      name: 'Payhuk Team'
    }
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Payhuk',
    url: 'https://payhuk.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://payhuk.com/marketplace?search={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <Helmet>
      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      
      {/* Website Schema avec SearchAction */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
    </Helmet>
  );
};

