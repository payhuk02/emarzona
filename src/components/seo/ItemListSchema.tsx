/**
 * Composant Schema.org pour les pages de liste d'éléments (ItemList)
 * Utilisé pour les marketplace, catégories, collections de produits
 * Format: ItemList Schema (https://schema.org/ItemList)
 */

import { Helmet } from 'react-helmet';

interface ItemListSchemaProps {
  items: Array<{
    id: string;
    name: string;
    url: string;
    image?: string;
    description?: string;
    price?: number;
    currency?: string;
    rating?: number;
  }>;
  name: string;
  description?: string;
  url: string;
  numberOfItems?: number;
}

export const ItemListSchema = ({ 
  items, 
  name, 
  description, 
  url,
  numberOfItems 
}: ItemListSchemaProps) => {
  if (!items || items.length === 0) return null;

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://payhuk.com';

  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  // ItemList Schema.org
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description: description || `${name} sur Payhuk`,
    url: fullUrl,
    numberOfItems: numberOfItems || items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
        name: item.name,
        ...(item.description && { description: item.description }),
        ...(item.image && { image: item.image }),
        ...(item.price && {
          offers: {
            '@type': 'Offer',
            price: item.price,
            priceCurrency: item.currency || 'XOF'
          }
        }),
        ...(item.rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: item.rating,
            bestRating: '5',
            worstRating: '1'
          }
        })
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(itemListSchema)}
      </script>
    </Helmet>
  );
};

