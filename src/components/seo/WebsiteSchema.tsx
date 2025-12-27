/**
 * Composant: WebsiteSchema
 * Description: Génère les données structurées Schema.org pour le site web global
 * Usage: <WebsiteSchema /> (généralement dans Layout ou App)
 */

import { Helmet } from 'react-helmet';

export const WebsiteSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Emarzona',
    alternateName: 'Emarzona - Plateforme de ecommerce et marketing',
    url: window.location.origin,
    description:
      'Plateforme de ecommerce et marketing. Vendez vos produits digitaux, physiques, services et cours en ligne. Solution e-commerce moderne et sécurisée.',
    inLanguage: 'fr-FR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${window.location.origin}/marketplace?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Emarzona',
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/emarzona-logo.png`,
      },
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default WebsiteSchema;






