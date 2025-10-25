/**
 * Composant: StoreSchema
 * Description: Génère les données structurées Schema.org pour une boutique
 * Usage: <StoreSchema store={...} />
 */

import { Helmet } from 'react-helmet';

interface StoreSchemaProps {
  store: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    contact_email?: string;
    contact_phone?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
  };
}

export const StoreSchema = ({ store }: StoreSchemaProps) => {
  const storeUrl = `${window.location.origin}/stores/${store.slug}`;
  
  // Construction des liens réseaux sociaux
  const socialLinks = [
    store.facebook_url,
    store.instagram_url,
    store.twitter_url,
    store.linkedin_url
  ].filter(Boolean);
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": store.name,
    "description": store.description || `Boutique en ligne de ${store.name} sur Payhula`,
    "url": storeUrl,
    "logo": store.logo_url,
    "image": store.banner_url || store.logo_url,
    ...(store.contact_phone && { "telephone": store.contact_phone }),
    ...(store.contact_email && { "email": store.contact_email }),
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BF" // Burkina Faso par défaut, à personnaliser
    },
    ...(socialLinks.length > 0 && { "sameAs": socialLinks })
  };
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default StoreSchema;

