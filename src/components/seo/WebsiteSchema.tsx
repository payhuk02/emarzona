/**
 * Composant: WebsiteSchema
 * Description: Génère les données structurées Schema.org pour le site web global
 * Usage: <WebsiteSchema /> (généralement dans Layout ou App)
 */

import { Helmet } from 'react-helmet';

export const WebsiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Payhula",
    "alternateName": "Payhuk",
    "url": window.location.origin,
    "description": "Marketplace de produits digitaux et physiques en Afrique. Vendez vos formations, ebooks, templates et services en ligne avec paiement Mobile Money.",
    "inLanguage": "fr-FR",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/marketplace?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Payhula",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/payhuk-logo.png`
      }
    }
  };
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default WebsiteSchema;

