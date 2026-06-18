/**
 * Composant: WebsiteSchema
 * Description: Génère les données structurées Schema.org pour le site web global
 * Usage: <WebsiteSchema /> (généralement dans Layout ou App)
 */

import { Helmet } from 'react-helmet-async';
import { LANDING_SEO_DEFAULTS } from '@/lib/landing-seo';

export const WebsiteSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Emarzona',
    alternateName: 'Emarzona',
    url: window.location.origin,
    description: LANDING_SEO_DEFAULTS.description,
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
