/**
 * Composant Schema.org pour les pages boutiques (storefront)
 * Format: Organization Schema
 */

import { Helmet } from 'react-helmet';
import { logger } from '@/lib/logger';

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
    youtube_url?: string;
    tiktok_url?: string;
    pinterest_url?: string;
    created_at?: string;
    active_clients?: number;
    // Localisation
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    // Horaires
    opening_hours?: {
      monday?: { open: string; close: string; closed: boolean };
      tuesday?: { open: string; close: string; closed: boolean };
      wednesday?: { open: string; close: string; closed: boolean };
      thursday?: { open: string; close: string; closed: boolean };
      friday?: { open: string; close: string; closed: boolean };
      saturday?: { open: string; close: string; closed: boolean };
      sunday?: { open: string; close: string; closed: boolean };
      timezone?: string;
    };
  };
  url?: string; // Optionnel, sera généré automatiquement si non fourni
}

export const StoreSchema = ({ store, url }: StoreSchemaProps) => {
  // Vérifier que store existe
  if (!store) {
    logger.warn('[StoreSchema] Store is missing');
    return null;
  }

  // Générer l'URL par défaut à partir du slug si non fournie
  const defaultUrl = `/stores/${store.slug}`;
  const providedUrl = url || defaultUrl;
  
  // Construire l'URL complète
  const fullUrl = providedUrl.startsWith('http') 
    ? providedUrl 
    : `https://emarzona.com${providedUrl}`;
  
  // Réseaux sociaux
  const socialLinks = [
    store.facebook_url,
    store.instagram_url,
    store.twitter_url,
    store.linkedin_url,
    store.youtube_url,
    store.tiktok_url,
    store.pinterest_url
  ].filter(Boolean);

  // Déterminer le type de schéma : LocalBusiness si adresse disponible, sinon Store
  const hasAddress = !!(store.address_line1 || store.city || store.country);
  const schemaType = hasAddress ? 'LocalBusiness' : 'Store';

  // Construire l'adresse postale si disponible
  const postalAddress = (store.address_line1 || store.city || store.country) ? {
    '@type': 'PostalAddress',
    ...(store.address_line1 && { streetAddress: store.address_line1 }),
    ...(store.address_line2 && { addressLine2: store.address_line2 }),
    ...(store.city && { addressLocality: store.city }),
    ...(store.state_province && { addressRegion: store.state_province }),
    ...(store.postal_code && { postalCode: store.postal_code }),
    ...(store.country && { addressCountry: store.country })
  } : undefined;

  // Construire les horaires d'ouverture
  const openingHoursSpecification = store.opening_hours ? (() => {
    const days = [
      { key: 'monday', day: 'Monday' },
      { key: 'tuesday', day: 'Tuesday' },
      { key: 'wednesday', day: 'Wednesday' },
      { key: 'thursday', day: 'Thursday' },
      { key: 'friday', day: 'Friday' },
      { key: 'saturday', day: 'Saturday' },
      { key: 'sunday', day: 'Sunday' }
    ];

    return days
      .map(({ key, day }) => {
        const dayHours = store.opening_hours![key as keyof typeof store.opening_hours];
        if (!dayHours || dayHours.closed) return null;

        return {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${day}`,
          opens: dayHours.open || '09:00',
          closes: dayHours.close || '18:00'
        };
      })
      .filter(Boolean);
  })() : undefined;

  const storeSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: store.name,
    url: fullUrl,
    
    ...(store.description && {
      description: store.description
    }),
    
    // Logo et images
    ...(store.logo_url && {
      logo: store.logo_url,
      image: [store.logo_url, store.banner_url].filter(Boolean)
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

    // Adresse postale (pour LocalBusiness)
    ...(postalAddress && {
      address: postalAddress
    }),

    // Coordonnées géographiques
    ...(store.latitude && store.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: store.latitude,
        longitude: store.longitude
      }
    }),

    // Horaires d'ouverture
    ...(openingHoursSpecification && openingHoursSpecification.length > 0 && {
      openingHoursSpecification
    }),
    
    // Organisation parente
    parentOrganization: {
      '@type': 'Organization',
      name: 'Emarzona',
      url: 'https://emarzona.com'
    },

    // Dates
    ...(store.created_at && {
      foundingDate: store.created_at
    }),

    // Métadonnées supplémentaires
    ...(store.active_clients && store.active_clients > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.5, // TODO: Calculer à partir des vraies données
        reviewCount: store.active_clients
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(storeSchema)}
      </script>
    </Helmet>
  );
};
