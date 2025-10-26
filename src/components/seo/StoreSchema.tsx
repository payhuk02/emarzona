/**
 * Composant Schema.org pour les pages boutiques (storefront)
 * Format: Organization Schema
 */

import { Helmet } from 'react-helmet';

interface StoreSchemaProps {
  store: {
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
    created_at?: string;
    active_clients?: number;
  };
  url?: string; // Optionnel, sera généré automatiquement si non fourni
}

export const StoreSchema = ({ store, url }: StoreSchemaProps) => {
  // Vérifier que store existe
  if (!store) {
    console.warn('[StoreSchema] Store is missing');
    return null;
  }

  // Générer l'URL par défaut à partir du slug si non fournie
  const defaultUrl = `/stores/${store.slug}`;
  const providedUrl = url || defaultUrl;
  
  // Construire l'URL complète
  const fullUrl = providedUrl.startsWith('http') 
    ? providedUrl 
    : `https://payhuk.com${providedUrl}`;
  
  // Réseaux sociaux
  const socialLinks = [
    store.facebook_url,
    store.instagram_url,
    store.twitter_url,
    store.linkedin_url
  ].filter(Boolean);

  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    url: fullUrl,
    ...(store.description && {
      description: store.description
    }),
    
    // Logo
    ...(store.logo_url && {
      logo: store.logo_url,
      image: store.logo_url
    }),
    
    // Contact
    ...(store.contact_email && {
      email: store.contact_email
    }),
    ...(store.contact_phone && {
      telephone: store.contact_phone
    }),
    
    // Réseaux sociaux
    ...(socialLinks.length > 0 && {
      sameAs: socialLinks
    }),
    
    // Organisation parente
    parentOrganization: {
      '@type': 'Organization',
      name: 'Payhuk',
      url: 'https://payhuk.com'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(storeSchema)}
      </script>
    </Helmet>
  );
};
